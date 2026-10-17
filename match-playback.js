/* One cancellable clock for text broadcasts and automatic court hand-offs. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MatchPlayback=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 function create(env){let timer=null,epoch=0;
  function stop(){epoch++;if(timer!==null)env.clear(timer);timer=null;}
  function sync(){stop();const state=env.state();if(!env.ready()||!state?.match?.highlights||state.stage!=='match'||state.match.highlights.playbackPaused)return;
   const token=epoch,match=state.match;timer=env.set(()=>{timer=null;if(token!==epoch||!env.ready()||env.state()?.match!==match||match.highlights.playbackPaused)return;
    if(match.highlights.phase==='moment'){env.enter();return;}
    if(env.tick()){env.changed();}else stop();
   },match.highlights.phase==='moment'?650:match.highlights.phase==='feedback'?1400:1600);
  }
  return {sync,stop};
 }
 return {create};
});
