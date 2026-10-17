/* Keep portrait controls within the visible phone viewport, including Safari toolbars. */
(function(){'use strict';
 function fit(){const v=window.visualViewport,zoomed=v&&Math.abs(v.scale-1)>.05,height=zoomed?innerHeight:v?.height||innerHeight,top=zoomed?0:v?.offsetTop||0;document.documentElement.style.setProperty('--app-height',Math.round(height)+'px');document.documentElement.style.setProperty('--app-top',Math.round(top)+'px');}
 window.addEventListener('resize',fit,{passive:true});window.addEventListener('pageshow',fit);window.visualViewport?.addEventListener('resize',fit,{passive:true});window.visualViewport?.addEventListener('scroll',fit,{passive:true});fit();
})();
