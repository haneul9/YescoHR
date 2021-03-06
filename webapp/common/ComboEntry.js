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
      constructor: function ({ codeKey = 'code', valueKey = 'text', aEntries = [] }) {
        return [{ [codeKey]: 'ALL', [valueKey]: AppUtils.getBundleText('LABEL_00268') }, ..._.map(aEntries, (o) => _.omit(o, '__metadata'))];
      },
    });
  }
);
