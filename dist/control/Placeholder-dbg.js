sap.ui.define(
  [
    'sap/ui/core/Control', //
  ],
  function (Control) {
    'use strict';
    return Control.extend('sap.ui.yesco.control.Placeholder', {
      metadata: {
        properties: {
          width: { type: 'sap.ui.core.CSSSize', defaultValue: '200px' },
          line: { type: 'int', defaultValue: 5 },
        },
        aggregations: {
          //   _rating: { type: 'sap.m.RatingIndicator', multiple: false, visibility: 'hidden' },
        },
        events: {},
      },

      renderer: function (oRM, oControl) {
        oRM.write('<div');
        oRM.writeControlData(oControl);
        oRM.addClass('ui placeholder');
        oRM.writeClasses();
        oRM.addStyle('width', oControl.getWidth());
        oRM.writeStyles();
        oRM.write('>');
        for (let i = 0; i < oControl.getLine(); i++) {
          oRM.write('<div');
          oRM.addClass('line');
          oRM.writeClasses();
          oRM.write('>');
          oRM.write('</div>');
        }
        oRM.write('</div>');
        // oRM.renderControl(oControl.getAggregation('_rating'));
      },
    });
  }
);
