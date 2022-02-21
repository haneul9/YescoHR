sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
  ],
  (
    // prettier 방지용 주석
    Fragment
  ) => {
    'use strict';

    return {
      // 상태값 Popover
      onPopover(oEvent) {
        const oButton = oEvent.getSource();

        if (!this._pPopover) {
          const oView = this.getView();

          this._pPopover = Fragment.load({
            id: oView.getId(),
            name: 'sap.ui.yesco.fragment.mobile.ListStatusPopover',
            controller: this,
          }).then((oPopover) => {
            oView.addDependent(oPopover);
            return oPopover;
          });
        }

        this._pPopover.then((oPopover) => {
          oPopover.openBy(oButton);
        });
      },
    };
  }
);
