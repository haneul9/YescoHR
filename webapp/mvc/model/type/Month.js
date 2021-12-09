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

    return TypeDate.extend('sap.ui.yesco.mvc.model.type.Month', {
      constructor: function (...args) {
        TypeDate.apply(this, args);

        const oFormatOptions = {
          pattern: AppUtils.getAppComponent()
            .getSessionModel()
            .getProperty('/Dtfmt')
            .replace(/([a-zA-Z]{4})([^a-zA-Z]?)([a-zA-Z]{2}).*/, '$1$2$3'),
        };
        this.setFormatOptions(oFormatOptions);
        this.sName = 'CustomMonth';
      },

      getFormatPatternForMoment() {
        return AppUtils.getAppComponent()
          .getSessionModel()
          .getProperty('/DTFMT')
          .replace(/([a-zA-Z]{4})([^a-zA-Z]?)([a-zA-Z]{2}).*/, '$1$2$3');
      },

      getParsePatternForMoment() {
        return 'YYYYMM';
      },
    });
  }
);
