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

    /**
     * Leading zero trim
     */
    return SimpleType.extend('sap.ui.yesco.mvc.model.type.Docno', {
      formatValue(oValue) {
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
