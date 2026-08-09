(function(){
  var root  = document.querySelector('.agent-cluster');
  if (!root) return;
  var cards = Array.prototype.slice.call(root.querySelectorAll('.ac-card'));
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* order of the idle tour, and how long each card gets (one full icon loop) */
  var TOUR = [
    ['ac-follow',  4500],
    ['ac-booking', 4000],
    ['ac-support', 4000],
    ['ac-crm',     3400],
    ['ac-leads',   3200]
  ];
  var GAP = 350;   /* pause between turns */

  function wires(card, on){
    (card.dataset.wires || '').split(' ').filter(Boolean).forEach(function(id){
      var el = document.getElementById(id);
      if (el) el.classList.toggle('lit', on);
    });
  }
  function rewind(card){
    card.classList.add('ac-reset');
    void card.offsetWidth;           /* forces the restart */
    card.classList.remove('ac-reset');
  }
  function clear(card){
    card.classList.remove('is-playing');
    wires(card, false);
    rewind(card);
  }

  var step = 0, timer = null, held = false, visible = true;

  function play(){
    if (held || !visible || reduce) return;
    var entry = TOUR[step % TOUR.length];
    var card  = root.querySelector('.' + entry[0]);
    if (!card) { step++; timer = setTimeout(play, 0); return; }
    card.classList.add('is-playing');
    wires(card, true);
    timer = setTimeout(function(){
      clear(card);
      step++;
      timer = setTimeout(play, GAP);
    }, entry[1]);
  }
  function hold(){                    /* pointer took over */
    held = true;
    clearTimeout(timer);
    cards.forEach(clear);
  }
  function release(){
    if (!held) return;
    held = false;
    clearTimeout(timer);
    timer = setTimeout(play, 400);
  }

  cards.forEach(function(card){
    var take = function(){ hold(); wires(card, true); };
    var give = function(){
      if (card.classList.contains('is-active')) return;   /* tapped open, keep it */
      wires(card, false);
      rewind(card);
      release();
    };
    card.addEventListener('pointerenter', take);
    card.addEventListener('pointerleave', give);
    card.addEventListener('focus', take);
    card.addEventListener('blur', give);

    /* tap on touch screens keeps one card running until the next tap */
    card.addEventListener('click', function(){
      var was = card.classList.contains('is-active');
      cards.forEach(function(c){ c.classList.remove('is-active'); wires(c, false); });
      if (was) { rewind(card); release(); }
      else     { hold(); card.classList.add('is-active'); wires(card, true); }
    });
    card.addEventListener('keydown', function(e){
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
    });
  });

  /* don't run the tour while the graphic is off screen */
  if (window.IntersectionObserver){
    new IntersectionObserver(function(entries){
      visible = entries[0].isIntersecting;
      if (visible) { clearTimeout(timer); timer = setTimeout(play, 300); }
      else { clearTimeout(timer); cards.forEach(clear); }
    }, {threshold: 0.15}).observe(root);
  } else {
    timer = setTimeout(play, 600);
  }
})();
