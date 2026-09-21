import {DatabaseSync,backup} from 'node:sqlite';
const source=process.env.STUDIO_DB_PATH||'./data/studio.sqlite';
const destination=process.argv[2];
if(!destination)throw Error('Usage: node backup.mjs <destination.sqlite>');
const db=new DatabaseSync(source,{readOnly:true});
try{await backup(db,destination);console.log('SQLite backup completed.');}finally{db.close();}
