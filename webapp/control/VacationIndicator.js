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
          showTotal: {
            type: 'boolean',
            defaultValue: false,
          },
        },
      },

      renderer: (oRM, oControl) => {
        const sAlign = oControl.getAlign();
        const sWidth = oControl.getWidth();
        const bShowTotal = oControl.getShowTotal();
        const fTotal = parseFloat(oControl.getTotal());
        const fUsed = parseFloat(oControl.getUsed());
        const fRemain = fTotal - fUsed;
        const fMinPercent = 18;
        const fMaxPercent = 82;

        let fUsedPercent = (fUsed / fTotal) * 100;
        fUsedPercent = fUsedPercent < fMinPercent ? fMinPercent : fUsedPercent;
        fUsedPercent = fUsedPercent < 100 && fUsedPercent > fMaxPercent ? fMaxPercent : fUsedPercent;

        const sStyleClassAlign = sAlign === 'Top' ? 'vacation-indicator-top' : sAlign === 'Bottom' ? 'vacation-indicator-bottom' : 'vacation-indicator-middle';
        const sStyleClassTotal = bShowTotal ? ' vacation-indicator-show-total' : '';
        const sDivTotal = bShowTotal ? `<div class="vacation-indicator-total w-100">${fTotal}</div>` : '';
        const sDivRemain = bShowTotal
          ? `<div class="vacation-indicator-remain vacation-indicator-animation" style="width:66.6666667%">${fRemain}</div>`
          : `<div class="vacation-indicator-remain${fRemain === 0 ? ' vacation-indicator-zero' : ''} w-100">${fRemain}</div>`;
        const sDivUsed = bShowTotal
          ? `<div class="vacation-indicator-used vacation-indicator-animation" style="width:33.3333333%">${fUsed}</div>`
          : `<div class="vacation-indicator-used vacation-indicator-animation${fUsed === 0 ? ' vacation-indicator-zero' : ''}" style="width:${fUsedPercent}%">${fUsed}</div>`;

        oRM.write(`<div class="vacation-indicator ${sStyleClassAlign}${sStyleClassTotal}" style="width:${sWidth}">
  <div class="w-100 vacation-indicator-gauge">
    ${sDivTotal}
    ${sDivRemain}
    ${sDivUsed}
  </div>
  <div class="w-100 vacation-indicator-text">
    ${sDivTotal}
    ${sDivRemain}
    ${sDivUsed}
  </div>
</div>`);
      },
    });
  }
);
