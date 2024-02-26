



var e=function(e){const n=e,r=new Set,t=new Set;return{push:function(e,t=n){if(t){if([...r].find((n=>t(n,e))))return}r.add(e)},pop:function(){let e=[...r].find((e=>!t.has(e)));return void 0!==e&&t.add(e),e},remaining:function(){return r.size-t.size},queued:r,processed:t,clear:function(){r.clear(),t.clear()}}};export{e as default};