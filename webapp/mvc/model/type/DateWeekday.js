sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/FormatException',
    'sap/ui/model/ParseException',
    'sap/ui/model/SimpleType',
    'sap/ui/yesco/common/AppUtils',
  ],
  (
    // prettier 방지용 주석
    FormatException,
    ParseException,
    SimpleType,
    AppUtils
  ) => {
    'use strict';

    /**
     * Edm.DateTime
     */
    return SimpleType.extend('sap.ui.yesco.mvc.model.type.DateWeekday', {
      constructor: function (...args) {
        SimpleType.apply(this, args);

        const formatPattern = AppUtils.getAppComponent().getSessionModel().getProperty('/Dtfmt');
        const oFormatOptions = {
          pattern: `${formatPattern} EEE`,
        };
        this.setFormatOptions(oFormatOptions);
        this.sName = 'CustomDateWeekday';
      },

      formatValue(oValue, sTargetType) {
        // AppUtils.debug(`sap/ui/yesco/mvc/model/type/Date.formatValue(${oValue}, ${sTargetType})`);

        switch (this.getPrimitiveType(sTargetType)) {
          case 'string':
          case 'any':
            return this._toString(oValue, sTargetType);
          case 'object':
            return this._toObject(oValue, sTargetType);
          default:
            throw new FormatException(`Don't know how to format Date to ${sTargetType}`);
        }
      },

      parseValue(oValue, sTargetType) {
        // AppUtils.debug(`sap/ui/yesco/mvc/model/type/Date.parseValue(${oValue}, ${sTargetType})`);

        switch (this.getPrimitiveType(sTargetType)) {
          case 'string':
            return this._toString(oValue, sTargetType);
          case 'object':
          case 'any':
            return this._toObject(oValue, sTargetType);
          default:
            throw new ParseException(`Don't know how to parse Date from ${sTargetType}`);
        }
      },

      validateValue() {
        return true;
      },

      _toString(oValue, sTargetType) {
        if (!oValue) {
          return '';
        }

        const sDTFMT = this.getFormatPatternForMoment();

        if (oValue instanceof Date) {
          return moment(oValue).format(sDTFMT);
        }

        if (typeof oValue === 'string' || oValue instanceof String) {
          return this.getMoment(oValue).format(sDTFMT);
        }

        throw new FormatException(`Don't know how to format Date to ${sTargetType}`);
      },

      _toObject(oValue, sTargetType) {
        if (!oValue) {
          return null;
        }

        if (oValue instanceof Date) {
          return oValue;
        }

        if (typeof oValue === 'string' || oValue instanceof String) {
          return this.getMoment(oValue).toDate();
        }

        throw new ParseException(`Don't know how to parse Date from ${sTargetType}`);
      },

      getFormatPatternForMoment() {
        const sDTFMT = AppUtils.getAppComponent().getSessionModel().getProperty('/DTFMT');
        return `${sDTFMT} ddd`;
      },

      getParsePatternForMoment() {
        return 'YYYYMMDD';
      },

      getMoment(oValue) {
        if (/^\/Date/.test(oValue)) {
          const iTime = parseInt(oValue.replace(/\/Date\((-?\d+)\)\//, '$1'), 10);
          return moment(iTime).hour(9);
        }

        const sDateString = oValue.replace(/[^\d]/g, '');
        return moment(sDateString, this.getParsePatternForMoment()).hour(9);
      },
    });
  }
);
