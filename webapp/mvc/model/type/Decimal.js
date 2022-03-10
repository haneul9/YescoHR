sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/type/Float',
  ],
  (
    // prettier 방지용 주석
    Float
  ) => {
    'use strict';

    /**
     * Leading zero trim
     */
    return Float.extend('sap.ui.yesco.mvc.model.type.Decimal', {
      formatValue() {
        const dValue = Float.prototype.formatValue.apply(this, arguments);

        return _.isEqual(_.toNumber(dValue), 0) ? '' : _.chain(dValue).toNumber().toString().value();
      },
    });
  }
);
