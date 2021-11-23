sap.ui.define(
  [
    'sap/ui/base/Object', //
    'sap/ui/yesco/common/AppUtils',
  ],
  function (BaseObject, AppUtils) {
    'use strict';

    return BaseObject.extend('sap.ui.yesco.common.ComboEntry', {
      /**
       * @override
       * @returns {sap.ui.base.Object}
       */
      constructor: function ({ codeKey, valueKey, mEntries = [] }) {
        return [{ [codeKey]: 'ALL', [valueKey]: AppUtils.getBundleText('LABEL_00268') }, ...mEntries];
      },
    });
  }
);
