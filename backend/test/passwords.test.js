import test from'node:test';
import assert from'node:assert/strict';
import{hashPassword,verifyPassword}from'../src/security/passwords.js';

test('passwords are salted and verified',async()=>{const first=await hashPassword('Secret-2026'),second=await hashPassword('Secret-2026');assert.notEqual(first,second);assert.equal(await verifyPassword(first,'Secret-2026'),true);assert.equal(await verifyPassword(first,'wrong'),false)});
