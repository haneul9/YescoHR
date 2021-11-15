sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Control',
  ],
  function (
    // prettier 방지용 주석
    Control
  ) {
    'use strict';

    return Control.extend('sap.ui.yesco.control.VacationIndicator', {
      metadata: {
        properties: {
          width: {
            type: 'sap.ui.core.CSSSize',
            defaultValue: '10rem',
          },
          align: {
            type: 'string',
            defaultValue: 'Middle',
          },
          used: {
            type: 'float',
            defaultValue: 0,
          },
          total: {
            type: 'float',
            defaultValue: 14,
          },
          hideTotal: {
            type: 'boolean',
            defaultValue: false,
          },
        },
      },

      renderer: (oRM, oControl) => {
        const sAlign = oControl.getAlign();
        const sAlignStyleClass = sAlign === 'Top' ? ' vacation-indicator-top' : sAlign === 'Bottom' ? ' vacation-indicator-bottom' : '';
        const sWidth = oControl.getWidth();
        const bHideTotal = oControl.getHideTotal();
        const fTotal = parseFloat(oControl.getTotal());
        const fUsed = parseFloat(oControl.getUsed());
        const fRemain = fTotal - fUsed;

        oRM.write(`<div class="vacation-indicator${sAlignStyleClass}" style="width:${sWidth}">
  <div class="w-100 vacation-indicator-gauge">
    ${bHideTotal ? '' : '<div class="vacation-indicator-total w-100"></div>'}
    <div class="vacation-indicator-remain vacation-indicator-animation" style="width:${bHideTotal ? 100 : (fRemain / fTotal) * 100}%"></div>
    <div class="vacation-indicator-used vacation-indicator-animation" style="width:${bHideTotal ? (fUsed / fRemain) * 100 : (fUsed / fTotal) * 100}%"></div>
  </div>
  <div class="w-100 vacation-indicator-text">
    ${bHideTotal ? '' : `<div class="w-100">${fTotal}</div>`}
    <div class="vacation-indicator-animation" style="width:${bHideTotal ? 100 : (fRemain / fTotal) * 100}%">${fRemain}</div>
    <div class="vacation-indicator-animation" style="width:${bHideTotal ? (fUsed / fRemain) * 100 : (fUsed / fTotal) * 100}%">${fUsed}</div>
  </div>
</div>`);
      },
    });
  }
);
