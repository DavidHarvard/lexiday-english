import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
export function database(filename=':memory:'){
 const db=new DatabaseSync(filename);db.exec(readFileSync(new URL('../migrations/0001_accounts.sql',import.meta.url),'utf8'));
 function prepare(sql){let values=[];const stmt={bind(...v){values=v;return stmt;},async first(){return db.prepare(sql).get(...values)||null;},async all(){return {results:db.prepare(sql).all(...values)};},async run(){const r=db.prepare(sql).run(...values);return {meta:{changes:Number(r.changes)}};}};return stmt;}
 return {prepare,async batch(statements){db.exec('BEGIN');try{const result=[];for(const s of statements)result.push(await s.run());db.exec('COMMIT');return result;}catch(e){db.exec('ROLLBACK');throw e;}},close(){db.close();}};
}
