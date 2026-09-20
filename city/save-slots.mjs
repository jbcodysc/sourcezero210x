import {migrateSecurityIdentity} from '../fairmont/security-identity.mjs';
import {SAVE_KEY,validProgress} from './progress.mjs';
import {migrateOpening} from './opening.mjs';
export const SLOTS_KEY='source-zero-bellwether-slots-v1';
export class SaveSlots{
 constructor(storage){this.storage=storage;this.available=!!storage;this.slots=[null,null,null];this.imported=false;
  try{const raw=storage?.getItem(SLOTS_KEY);if(raw){const book=JSON.parse(raw);if(book?.version===1&&Array.isArray(book.slots))this.slots=this.slots.map((_,i)=>validProgress(book.slots[i])?migrateSecurityIdentity(migrateOpening(book.slots[i])):null);}
   else{const legacy=JSON.parse(storage?.getItem(SAVE_KEY)||'null');if(validProgress(legacy)){this.slots[0]=migrateSecurityIdentity(migrateOpening(legacy));this.imported=true;this.flush();}}
  }catch{this.available=false;}
 }
 read(index){return this.slots[index]?JSON.parse(JSON.stringify(this.slots[index])):null;}
 erase(index){if(!Number.isInteger(index)||index<0||index>2)return false;const previous=this.slots[index];this.slots[index]=null;if(this.flush())return true;this.slots[index]=previous;return false;}
 write(index,s){if(!Number.isInteger(index)||index<0||index>2||!validProgress(s))return false;this.slots[index]=JSON.parse(JSON.stringify({...s,savedAt:Date.now()}));return this.flush();}
 flush(){try{if(!this.storage)throw new Error('No storage');this.storage.setItem(SLOTS_KEY,JSON.stringify({version:1,slots:this.slots}));this.available=true;return true;}catch{this.available=false;return false;}}
}
