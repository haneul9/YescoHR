sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/m/Popover',
    'sap/ui/yesco/common/AppUtils',
  ],
  (
    // prettier 방지용 주석
    Popover,
    AppUtils
  ) => {
    'use strict';

    return Popover.extend('sap.ui.yesco.control.Popover', {
      metadata: {
        properties: {
          maxRows: { type: 'int', defaultValue: 5 },
        },
        events: {
          scroll: {},
        },
      },

      renderer: {},

      init(...aArgs) {
        Popover.prototype.init.apply(this, aArgs);

        this.oPopup.setAutoClose(false);
        if (AppUtils.isMobile()) {
          const iAvailHeight = screen.availHeight - 48 - 60; // (.sapMPopoverHeader height) - (.sapMPopoverFooter height)
          this.setContentHeight(`${iAvailHeight}px`);
          this.setContentWidth('100%');
          this.addStyleClass('full-popover');
        } else {
          const iAvailHeight = screen.availHeight - 51 - 83 - 60 - 10; // (Popover offset top) - (.sapMPopoverHeader height) - (.sapMPopoverFooter height) - (bottom 10)
          this.setContentHeight(`${iAvailHeight}px`);
          this.setContentWidth('490px');
        }
      },

      onAfterRendering(...aArgs) {
        Popover.prototype.onAfterRendering.apply(this, aArgs);

        if (!this.bScrollEventRegistered) {
          this.$()
            .find('.sapMPopoverScroll')[0]
            .addEventListener('scroll', _.throttle(this.fireScroll.bind(this), 1000));

          this.bScrollEventRegistered = true;
        }
      },

      isScrollBottom() {
        const $Cont = this.$().find('.sapMPopoverScroll');
        const oCont = $Cont[0];
        const iScrollMarginBottom = oCont.scrollHeight - oCont.scrollTop;
        const iGrowHeight = $Cont.height();

        return oCont.scrollTop > 0 && iScrollMarginBottom === iGrowHeight;
      },
    });
  }
);
