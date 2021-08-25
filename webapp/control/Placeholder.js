sap.ui.define(
  [
    'sap/ui/core/Control', //
  ],
  function (Control) {
    'use strict';
    return Control.extend('sap.ui.yesco.control.Placeholder', {
      metadata: {
        properties: {
          width: { type: 'sap.ui.core.CSSSize', defaultValue: '300px' },
        },
        aggregations: {
          //   _rating: { type: 'sap.m.RatingIndicator', multiple: false, visibility: 'hidden' },
          //   _label: { type: 'sap.m.Label', multiple: false, visibility: 'hidden' },
          //   _button: { type: 'sap.m.Button', multiple: false, visibility: 'hidden' },
        },
        events: {},
      },
      init: function () {
        // this.setAggregation(
        //   '_rating',
        //   new RatingIndicator({
        //     value: this.getValue(),
        //     iconSize: '2rem',
        //     visualMode: 'Half',
        //     liveChange: this._onRate.bind(this),
        //   })
        // );
        // this.setAggregation(
        //   '_label',
        //   new Label({
        //     text: '{i18n>productRatingLabelInitial}',
        //   }).addStyleClass('sapUiTinyMargin')
        // );
        // this.setAggregation(
        //   '_button',
        //   new Button({
        //     text: '{i18n>productRatingButton}',
        //     press: this._onSubmit.bind(this),
        //   })
        // );
      },

      renderer: function (oRM, oControl) {
        oRM.write('<div');
        oRM.writeControlData(oControl);
        oRM.addClass('ui placeholder');
        oRM.writeClasses();
        oRM.addStyle('width', oControl.getWidth());
        oRM.writeStyles();
        oRM.write('>');
        // oRM.renderControl(oControl.getAggregation('_rating'));
        // oRM.renderControl(oControl.getAggregation('_label'));
        // oRM.renderControl(oControl.getAggregation('_button'));
        oRM.write('<div');
        oRM.addClass('line');
        oRM.writeClasses();
        oRM.write('>');
        oRM.write('</div>');
        oRM.write('</div>');
      },
    });
  }
);
