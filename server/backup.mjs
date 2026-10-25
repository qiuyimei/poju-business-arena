import {backupDatabase,closeDatabase} from './runtime.mjs';
try{console.log(backupDatabase());}finally{closeDatabase();}
