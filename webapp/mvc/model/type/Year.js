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

    return TypeDate.extend('sap.ui.yesco.mvc.model.type.Year', {
      constructor: function (...args) {
        TypeDate.apply(this, args);

        const formatPattern = AppUtils.getAppComponent().getSessionModel().getProperty('/DtfmtYYYY');
        const oFormatOptions = {
          pattern: formatPattern,
        };
        this.setFormatOptions(oFormatOptions);
        this.sName = 'CustomYear';
        this.FORMAT_PATTERN = formatPattern;
      },

      getFormatPatternForMoment() {
        return AppUtils.getAppComponent().getSessionModel().getProperty('/DTFMTYYYY');
      },

      getParsePatternForMoment() {
        return 'YYYY';
      },
    });
  }
);
