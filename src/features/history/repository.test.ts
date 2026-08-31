import { getQuestHistoryDetail, listQuestHistory } from './repository';

test('SQ-0702 maps immutable snapshots and returns a stable terminal-time cursor', async () => {
  const rpc=jest.fn(async()=>({data:[
    {id:'07020000-0000-4000-8000-000000000401',status:'completed',snapshot:{title:'Later finish'},category_id:1,occurred_at:'2026-08-31T10:00:00Z',xp_awarded:120},
    {id:'07020000-0000-4000-8000-000000000402',status:'abandoned',snapshot:{title:'Stopped'},category_id:2,occurred_at:'2026-08-31T09:00:00Z',xp_awarded:0},
  ],error:null}));
  const first=await listQuestHistory({rpc} as never,'ignored',{limit:1,status:'completed'});
  expect(first.items).toEqual([{id:'07020000-0000-4000-8000-000000000401',status:'completed',title:'Later finish',categoryId:1,occurredAt:'2026-08-31T10:00:00Z',xpAwarded:120}]);
  expect(first.nextCursor).not.toBeNull();
  await listQuestHistory({rpc} as never,'ignored',{cursor:first.nextCursor,status:'completed'});
  expect(rpc).toHaveBeenLastCalledWith('list_quest_history',expect.objectContaining({p_cursor_at:'2026-08-31T10:00:00Z',p_cursor_id:'07020000-0000-4000-8000-000000000401',p_status:'completed'}));
});

test('SQ-0702 rejects a malformed cursor before querying', async()=>{
  const rpc=jest.fn(); await expect(listQuestHistory({rpc} as never,'user',{cursor:'not-a-cursor'})).rejects.toThrow('Invalid history cursor'); expect(rpc).not.toHaveBeenCalled();
});

test('SQ-0702 signs only the exact uploaded completion proof for five minutes',async()=>{
  const maybeSingle=jest.fn(async()=>({data:{id:'07020000-0000-4000-8000-000000000401',status:'completed',snapshot:{title:'Owned'},category_id:1,created_at:'2026-08-31T08:00:00Z',completed_at:'2026-08-31T10:00:00Z',abandoned_at:null,quest_completions:[{xp_awarded:100,proof_id:'proof-current'}],quest_proofs:[{id:'proof-old',storage_path:'user/q/old.jpg',note:null,mime_type:'image/jpeg',status:'pending_delete'},{id:'proof-current',storage_path:'user/q/current.jpg',note:'My photo',mime_type:'image/jpeg',status:'uploaded'}]},error:null}));
  const chain:any={select:()=>chain,eq:()=>chain,in:()=>chain,maybeSingle}; const createSignedUrl=jest.fn(async()=>({data:{signedUrl:'https://signed.example/proof'},error:null})); const client={from:()=>chain,storage:{from:()=>({createSignedUrl})}};
  const detail=await getQuestHistoryDetail(client as never,'user','07020000-0000-4000-8000-000000000401');
  expect(createSignedUrl).toHaveBeenCalledWith('user/q/current.jpg',300); expect(detail?.proof).toEqual({alt:'My photo',mimeType:'image/jpeg',note:'My photo',signedUrl:'https://signed.example/proof'}); expect(detail).not.toHaveProperty('storage_path');
});

test('SQ-0702 returns null for a foreign or missing owner-scoped detail',async()=>{const chain:any={select:()=>chain,eq:()=>chain,in:()=>chain,maybeSingle:async()=>({data:null,error:null})};await expect(getQuestHistoryDetail({from:()=>chain} as never,'user','07020000-0000-4000-8000-000000000499')).resolves.toBeNull();});
