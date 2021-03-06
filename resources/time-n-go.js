$(function () {
  const Statuses = { ON: 1, PAUSED: 0, RESET: 2 };

  const updateTile = ( { m, s, ms } ) => document.title = `${m}:${s}.${ms}`;

  const initState = () => ({
    pauseTime: 0,
    referenceTime: 0,
    status: Statuses.RESET,
    currentTimeStr: { m: '00', s: '00', ms: '000' },
    timerLoop: null
  });

  const stop = state => {
    state.status = Statuses.PAUSED;
    clearInterval( state.timerLoop );
    updateTile( state.currentTimeStr );
    state.pauseTime = Date.now();

    $( '.digit-wheel' ).removeClass( 'spinning' );
  };

  const resetWheels = () => new Promise( resolve => {
    $( '.digit-wheel' ).each( function (e) {
      const el = $( this );
      const style = window.getComputedStyle( el.get( 0 ) );
      const matrix3d = style.getPropertyValue( 'transform' );
  
      el.css( { animation: 'none', transform: matrix3d, transition: 'transform 500ms ease-out' } );
      setTimeout( () => el.addClass( 'reset' ) ); // make the add class async to prevent all being rendered together
    });
  
    setTimeout( () => {
      $( '.digit-wheel' ).attr( 'style', '' ).removeClass( 'reset' );
      resolve();
    }, 550 );
  } )

  const start = state => {
    state.status = Statuses.ON;
    state.referenceTime = !state.pauseTime ? Date.now() : state.referenceTime + (Date.now() - state.pauseTime);

    $( '.digit-wheel' ).addClass( 'spinning' );

    state.timerLoop = setInterval( () => {
      const time = Date.now() - state.referenceTime;
      const ms = String( time % 1000 ).padStart( 3, 0 );
      const m = String( Math.floor( time / 1000 / 60 ) ).padStart( 2, 0 );
      const s = String( Math.floor( time / 1000 ) - ( m * 60 ) ).padStart( 2, 0 );
      state.currentTimeStr = { ms, m, s };

      updateTile( state.currentTimeStr )
    }, 21 );
  };

  let currentState = initState();
      
  $( '.action' ).on( 'click', e => {
    e.preventDefault();
    if ( $( '.action' ).hasClass( 'disabled' ) ) { return; }

    if ( [ Statuses.PAUSED, Statuses.RESET ].includes( currentState.status ) ) {
      start( currentState );
      $( '.action' ).addClass( 'active' ).removeClass( 'paused' );
    } else {
      stop( currentState );
      $( '.action' ).addClass( 'paused' ).removeClass( 'active' );
    }
  });

  $( document ).on( 'keypress', e => {
    if ( e.charCode === 32 ) { // space
      $( '.action' ).trigger( 'click' );
    }
  });
  
  $( '.reset' ).on( 'click', async e => {
    e.preventDefault();

    stop( currentState );
    $( '.action' ).addClass( 'disabled paused' ).removeClass( 'active' );
    $( '.reset' ).addClass( 'active' );

    currentState = initState();
    
    await resetWheels();

    $( '.action' ).removeClass( 'disabled' );
    $( '.reset' ).removeClass( 'active' );

    document.title = 'Time\'n\'go';
  });
});
