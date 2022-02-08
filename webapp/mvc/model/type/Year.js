sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/mvc/model/type/Date',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    TypeDate
  ) => {
    'use strict';

    /**
     * Edm.DateTime
     */
    return TypeDate.extend('sap.ui.yesco.mvc.model.type.Year', {
      constructor: function (...args) {
        TypeDate.apply(this, args);

        const formatPattern = this.getSessionProperty('/DtfmtYYYY');
        const oFormatOptions = {
          pattern: formatPattern,
        };
        this.setFormatOptions(oFormatOptions);
        this.sName = 'CustomYear';
      },

      getFormatPatternForMoment() {
        return this.getSessionProperty('/DTFMTYYYY');
      },
    });
  }
);
