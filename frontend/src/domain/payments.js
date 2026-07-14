import{changeEvent,recordActivity}from'./activity.js';
import{daysLeft,todayPlus,uid}from'./workspace.js';

const now=()=>new Date().toISOString();
const invoicePaid=invoice=>(invoice.payments||[]).reduce((sum,payment)=>sum+Number(payment.amount||0),0);
const invoiceStatus=invoice=>{const paid=invoicePaid(invoice);if(paid>=Number(invoice.amount||0))return'Оплачен';if(paid>0)return'Частично оплачен';if(daysLeft(invoice.dueDate)<0)return'Просрочен';return'Выставлен'};

const paymentWorkflow=(state,workId)=>{
 const work=state.works.find(item=>item.id===workId),invoices=(state.invoices||[]).filter(item=>item.workId===workId),billed=invoices.reduce((sum,item)=>sum+Number(item.amount||0),0),paid=invoices.reduce((sum,item)=>sum+invoicePaid(item),0),saleTotal=state.positions.filter(position=>position.workId===workId).reduce((sum,position)=>sum+Number(position.salePrice||0)*Number(position.qty||0),0),debt=Math.max(0,billed-paid),remaining=Math.max(0,saleTotal-billed),overdue=invoices.some(item=>invoiceStatus(item)==='Просрочен'),fullyPaid=saleTotal>0&&paid>=saleTotal&&debt<=0;
 if(fullyPaid)return{state:'Закрыто успешно',paymentStatus:'Оплачено',expectedPaymentDate:'',nextAction:'Работа закрыта',nextActionDate:'',paidAt:now(),paymentSummary:{billed,paid,debt,remaining}};
 if(overdue)return{state:'Оплата',paymentStatus:'Просрочено',nextAction:'Получить просроченную оплату',nextActionDate:todayPlus(1),paymentSummary:{billed,paid,debt,remaining}};
 if(paid>0)return{state:'Оплата',paymentStatus:'Частичная оплата',nextAction:remaining>0?'Выставить оставшийся счёт':'Получить остаток оплаты',nextActionDate:invoices.map(item=>item.dueDate).filter(Boolean).sort()[0]||todayPlus(1),paymentSummary:{billed,paid,debt,remaining}};
 if(invoices.length)return{state:'Оплата',paymentStatus:'Счет выставлен',expectedPaymentDate:invoices.map(item=>item.dueDate).filter(Boolean).sort()[0]||'',nextAction:'Контролировать оплату счёта',nextActionDate:invoices.map(item=>item.dueDate).filter(Boolean).sort()[0]||todayPlus(1),paymentSummary:{billed,paid,debt,remaining}};
 return{state:work?.state||'Отгрузка',paymentStatus:'Не выставлен',nextAction:'Выставить счёт заказчику',nextActionDate:todayPlus(1),paymentSummary:{billed,paid,debt,remaining}};
};

export function createInvoice(state,workId,draft,actor){
 const work=state.works.find(item=>item.id===workId);if(!work)throw new Error('Сделка не найдена');const amount=Number(draft.amount);if(!Number.isFinite(amount)||amount<=0)throw new Error('Сумма счёта должна быть больше нуля');
 const number=String(draft.number||'').trim();if(!number)throw new Error('Укажите номер счёта');if((state.invoices||[]).some(item=>item.number===number))throw new Error('Счёт с таким номером уже существует');
 const invoice={id:uid(),workId,number,amount,issueDate:draft.issueDate||new Date().toISOString().slice(0,10),dueDate:draft.dueDate||todayPlus(14),note:String(draft.note||''),payments:[],status:'Выставлен',createdAt:now(),createdBy:actor?.id||null,createdByName:actor?.name||'Менеджер'};
 let next={...state,invoices:[invoice,...(state.invoices||[])]};const workflow=paymentWorkflow(next,workId);next={...next,works:next.works.map(item=>item.id===workId?{...item,...workflow,updatedAt:now()}:item)};
 next=recordActivity(next,changeEvent({workId,type:'payment',title:`Выставлен счёт №${number}`,detail:`Сумма ${amount} · оплатить до ${invoice.dueDate}`,entityType:'invoice',entityId:invoice.id,newValue:invoice,actor,source:'ui'}));return{state:next,invoice}
}

export function recordInvoicePayment(state,invoiceId,draft,actor){
 const invoice=(state.invoices||[]).find(item=>item.id===invoiceId);if(!invoice)throw new Error('Счёт не найден');const amount=Number(draft.amount),outstanding=Math.max(0,Number(invoice.amount||0)-invoicePaid(invoice));if(!Number.isFinite(amount)||amount<=0)throw new Error('Сумма платежа должна быть больше нуля');if(amount>outstanding+0.01)throw new Error(`Платёж превышает остаток по счёту: ${outstanding}`);
 const payment={id:uid(),amount,date:draft.date||new Date().toISOString().slice(0,10),note:String(draft.note||''),createdAt:now(),createdBy:actor?.id||null},updated={...invoice,payments:[...(invoice.payments||[]),payment],updatedAt:now()};updated.status=invoiceStatus(updated);
 let next={...state,invoices:state.invoices.map(item=>item.id===invoiceId?updated:item)};const workflow=paymentWorkflow(next,invoice.workId);next={...next,works:next.works.map(item=>item.id===invoice.workId?{...item,...workflow,updatedAt:now()}:item)};
 next=recordActivity(next,changeEvent({workId:invoice.workId,type:'payment',title:`Получена оплата по счёту №${invoice.number}`,detail:`${amount} · ${payment.date}`,entityType:'invoice',entityId:invoice.id,newValue:payment,actor,source:'ui'}));return{state:next,payment}
}

export function updateInvoice(state,invoiceId,changes,actor){
 const invoice=(state.invoices||[]).find(item=>item.id===invoiceId);if(!invoice)throw new Error('Счёт не найден');const safe={...changes};if('amount'in safe){safe.amount=Number(safe.amount);if(!Number.isFinite(safe.amount)||safe.amount<=0)throw new Error('Некорректная сумма счёта');if(safe.amount<invoicePaid(invoice))throw new Error('Сумма счёта не может быть меньше уже полученной оплаты')}const updated={...invoice,...safe,updatedAt:now()};updated.status=invoiceStatus(updated);
 let next={...state,invoices:state.invoices.map(item=>item.id===invoiceId?updated:item)};const workflow=paymentWorkflow(next,invoice.workId);next={...next,works:next.works.map(item=>item.id===invoice.workId?{...item,...workflow,updatedAt:now()}:item)};
 next=recordActivity(next,changeEvent({workId:invoice.workId,type:'payment',title:`Изменён счёт №${invoice.number}`,detail:Object.keys(safe).join(', '),entityType:'invoice',entityId:invoice.id,oldValue:invoice,newValue:updated,actor,source:'ui'}));return next
}

export function deleteInvoice(state,invoiceId,actor){
 const invoice=(state.invoices||[]).find(item=>item.id===invoiceId);if(!invoice)throw new Error('Счёт не найден');if((invoice.payments||[]).length)throw new Error('Счёт с платежами удалить нельзя');let next={...state,invoices:state.invoices.filter(item=>item.id!==invoiceId)};const workflow=paymentWorkflow(next,invoice.workId);next={...next,works:next.works.map(item=>item.id===invoice.workId?{...item,...workflow,updatedAt:now()}:item)};
 next=recordActivity(next,changeEvent({workId:invoice.workId,type:'payment',title:`Удалён счёт №${invoice.number}`,detail:`Сумма ${invoice.amount}`,entityType:'invoice',entityId:invoice.id,oldValue:invoice,actor,source:'ui'}));return next
}

export const paymentTotals=(state,workId)=>{const invoices=(state.invoices||[]).filter(item=>item.workId===workId),billed=invoices.reduce((sum,item)=>sum+Number(item.amount||0),0),paid=invoices.reduce((sum,item)=>sum+invoicePaid(item),0);return{invoices,billed,paid,debt:Math.max(0,billed-paid),overdue:invoices.filter(item=>invoiceStatus(item)==='Просрочен').length,statusFor:invoiceStatus,paidFor:invoicePaid}}
