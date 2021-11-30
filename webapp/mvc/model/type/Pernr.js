sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/SimpleType',
  ],
  (
    // prettier 방지용 주석
    SimpleType
  ) => {
    'use strict';

    return SimpleType.extend('sap.ui.yesco.mvc.model.type.Pernr', {
      formatValue(oValue = '') {
        return (oValue || '').replace(/^0+/, '');
      },

      parseValue(oValue) {
        return oValue;
      },

      validateValue() {
        return true;
      },
    });
  }
);
