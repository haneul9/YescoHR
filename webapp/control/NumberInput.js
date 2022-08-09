sap.ui.define(['sap/m/Input'], function (Input) {
  'use strict';

  return Input.extend('sap.ui.yesco.control.NumberInput', {
    renderer: {},

    init(...aArgs) {
      Input.prototype.init.apply(this, aArgs);

      // const allowedKeyCodes = {
      //   8: true, // Backspace
      //   9: true, // Tab
      //   13: true, // Enter
      //   35: true, // End
      //   36: true, // Home
      //   37: true, // Arrow Left
      //   39: true, // Arrow Right
      //   46: true, // Delete
      // };
      const allowedKey = {
        F5: true,
        Escape: true,
        Tab: true,
        Shift: true,
        Enter: true,
        Backspace: true,
        Delete: true,
        Insert: true,
        Home: true,
        End: true,
        ArrowLeft: true,
        ArrowRight: true,
        NumLock: true,
        '-': true,
        '+': true,
        '.': true,
        1: true,
        2: true,
        3: true,
        4: true,
        5: true,
        6: true,
        7: true,
        8: true,
        9: true,
        0: true,
        e: true,
        E: true,
      };

      this.setType('Number');

      /**
       * - Keyboard 'G' key를 누를 경우 event 발생 순서
       *   1. Keyboard 'G' key를 누른다.
       *   2. keydown event가 발생한다. (input에는 'G' 입력이 반영되지 않은 상태)
       *   3. 'G'가 입력된다. (input에 입력한 'G' 입력이 반영된 상태)
       *   4. keypress event가 발생한다.
       *   5. Keyboard 'G' key에서 손을 뗀다.
       *   6. keyup event가 발생한다.
       *
       * - keydown, keyup event는 모든 key에 대해 event 발생
       * - keypress event는 숫자/영문/+/-/.//(slash)/`/Enter key에 대해서만 event 발생, 그 외 한글/MetaKey 입력시에는 발생하지 않음
       *
       *
       */
      this.attachBrowserEvent('keydown', (oEvent) => {
        console.log('keydown', oEvent);
        if (!allowedKey[oEvent.key]) {
          oEvent.preventDefault(); // 기본 동작 금지
          oEvent.stopPropagation(); // 이후 event로 전파 중지, 즉, keypress, keyup event 발생 중지
          oEvent.stopImmediatePropagation(); // 또 다른 keydown event handler 실행 중지
        }
      });
      this.attachBrowserEvent('keypress', (oEvent) => {
        const v = oEvent.target.value;
        console.log('keypress', v, v.length, /^[-+.]$/.test(v), isNaN(v));
        if (!v.length || /^[-+.]$/.test(v)) {
          return;
        }
        if (isNaN(v)) {
          oEvent.preventDefault(); // 기본 동작 금지
          oEvent.stopPropagation(); // 이후 event로 전파 중지, 즉, keypress, keyup event 발생 중지
          oEvent.stopImmediatePropagation(); // 또 다른 keydown event handler 실행 중지
          oEvent.target.value = oEvent.target.value.replace(/.$/, '');
          return;
        }
        oEvent.target.value = oEvent.target.value
          .replace(new RegExp(`^(.{${oEvent.target.maxLength}}).+`), '$1')
          .replace(/^[^0-9+-.]+/, '')
          .replace(/[^0-9eE_0.]/g, '');
      });

      this.attachBrowserEvent('mousewheel', (oEvent) => oEvent.preventDefault());

      // if (sap.ui.core.Control.prototype.init) {
      //   sap.ui.core.Control.prototype.init.apply(this, arguments); //run the super class's method first
      // }
    },
  });
});
