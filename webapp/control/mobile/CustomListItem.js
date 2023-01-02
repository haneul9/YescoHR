sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/m/CustomListItem',
    'sap/m/ListType',
  ],
  (
    // prettier 방지용 주석
    CustomListItem,
    ListType
  ) => {
    'use strict';

    return CustomListItem.extend('sap.ui.yesco.control.mobile.CustomListItem', {
      renderer: {},

      /**
       * @override
       */
      constructor: function (...aArgs) {
        CustomListItem.apply(this, aArgs);

        this.setType(ListType.Active);
      },
    });
  }
);
