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
          used2: {
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
          usedType: {
            type: 'string',
            defaultValue: 'Base',
          },
          chartOnly: {
            type: 'boolean',
            defaultValue: false,
          },
        },
      },

      onAfterRendering() {
        const bShowTotal = this.getShowTotal();
        const $indicator = this.$();

        // TODO : align 적용

        if (bShowTotal) {
          $indicator.find('.vacation-indicator').toggleClass('vacation-indicator-show-total', true);
          $indicator.find('.vacation-indicator-gauge,.vacation-indicator-text').prepend(`<div class="vacation-indicator-total w-100">${this.getTotal()}</div>`);
          $indicator.find('.vacation-indicator-remain,.vacation-indicator-used').hide().toggleClass('w-100 vacation-indicator-animation vacation-indicator-zero', false);
        } else {
          $indicator.find('.vacation-indicator').toggleClass('vacation-indicator-show-total', false);
          $indicator.find('.vacation-indicator-total').remove();
          $indicator.find('.vacation-indicator-used').hide();
          $indicator.find('.vacation-indicator-remain,.vacation-indicator-used').toggleClass('vacation-indicator-animation vacation-indicator-zero', false);
        }

        setTimeout(() => {
          if (bShowTotal) {
            let sRemain = '66.66666%';
            let sUsed = '33.33333%';

            if (this.getUsedType() === 'WeekTime') {
              const fTotal = this.getTotal();
              const fUsed = this.getUsed();
              const fUsed2 = this.getUsed2();

              sRemain = this._getWeekTimePercent(fTotal, fUsed2);
              sUsed = this._getWeekTimePercent(fTotal, fUsed);
            }

            $indicator.find('.vacation-indicator-remain').show().css('width', sRemain).toggleClass('vacation-indicator-animation', true);
            $indicator.find('.vacation-indicator-used').show().css('width', sUsed).toggleClass('vacation-indicator-animation', true);
          } else {
            $indicator.find('.vacation-indicator-remain').toggleClass('w-100', true);
            $indicator.find('.vacation-indicator-used').show().css('width', this._getUsedPercent()).toggleClass('vacation-indicator-animation', true);
          }
        }, 300);
      },

      // 개인별 근태현황 주 52시간 현황
      _getWeekTimePercent(fTotal = 0, fUsed = 0) {
        let fTimePercent = (parseFloat(fUsed) / parseFloat(fTotal)) * 100;

        return `${fTimePercent}%`;
      },

      _getUsedPercent() {
        const fTotal = parseFloat(this.getTotal());
        const fUsed = parseFloat(this.getUsed());
        const fMinPercent = 18;
        const fMaxPercent = 82;
        let fUsedPercent = (fUsed / fTotal) * 100;

        fUsedPercent = fUsedPercent < fMinPercent ? fMinPercent : fUsedPercent;
        fUsedPercent = fUsedPercent < 100 && fUsedPercent > fMaxPercent ? fMaxPercent : fUsedPercent;
        return `${fUsedPercent}%`;
      },

      renderer: {
        apiVersion: 2,
        render(oRM, oControl) {
          // wrapper div
          oRM.openStart('div', oControl);
          oRM.class('vacation-indicator');
          oRM.class(this.getAlignStyleClass(oControl));
          if (oControl.getShowTotal()) {
            oRM.class('vacation-indicator-show-total');
          }
          oRM.style('width', oControl.getWidth());
          oRM.openEnd();

          this.insertWrapper(oRM, oControl, 'gauge'); // gauge wrapper div

          if (!oControl.getChartOnly()) {
            this.insertWrapper(oRM, oControl, 'text'); // text wrapper div
          }

          oRM.close('div');
        },
        insertWrapper(oRM, oControl, sWrapperName) {
          oRM.openStart('div');
          oRM.class(`vacation-indicator-${sWrapperName}`);
          oRM.class('w-100');
          oRM.openEnd();

          this.insertTotalDiv(oRM, oControl); // total gauge div
          this.insertRemainDiv(oRM, oControl); // remain gauge div
          this.insertUsedDiv(oRM, oControl); // used gauge div

          oRM.close('div');
        },
        insertTotalDiv(oRM, oControl) {
          oRM.openStart('div');
          oRM.class('vacation-indicator-total');
          oRM.class('w-100');
          oRM.openEnd();
          oRM.text(oControl.getTotal());
          oRM.close('div');
        },
        insertRemainDiv(oRM, oControl) {
          const fRemain = this.getRemain(oControl);
          oRM.openStart('div');
          oRM.class('vacation-indicator-remain');
          if (!oControl.getShowTotal()) {
            oRM.class('w-100');
            if (fRemain === 0) {
              oRM.class('vacation-indicator-zero');
            }
          }
          oRM.openEnd();
          oRM.text(fRemain);
          oRM.close('div');
        },
        insertUsedDiv(oRM, oControl) {
          const fUsed = oControl.getUsed();
          oRM.openStart('div');
          oRM.class('vacation-indicator-used');
          if (!oControl.getShowTotal() && fUsed === 0) {
            oRM.class('vacation-indicator-zero');
          }
          oRM.openEnd();
          oRM.text(fUsed);
          oRM.close('div');
        },
        getAlignStyleClass(oControl) {
          const sAlign = oControl.getAlign();
          return sAlign === 'Top' ? 'vacation-indicator-top' : sAlign === 'Bottom' ? 'vacation-indicator-bottom' : 'vacation-indicator-middle';
        },
        getRemain(oControl) {
          let fTotal = 0;
          let fUsed = 0;
          let fRemain = 0;

          if (oControl.getUsedType() === 'WeekTime') {
            let fUsed2 = 0;

            fTotal = parseFloat(oControl.getTotal());
            fUsed = parseFloat(oControl.getUsed());
            fUsed2 = parseFloat(oControl.getUsed2());

            fRemain = fUsed + fUsed2;
          } else {
            fTotal = parseFloat(oControl.getTotal());
            fUsed = parseFloat(oControl.getUsed());

            fRemain = fTotal - fUsed;
          }

          return fRemain;
        },
      },
    });
  }
);
