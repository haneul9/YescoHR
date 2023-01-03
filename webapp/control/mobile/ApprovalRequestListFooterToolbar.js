sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/m/Button',
    'sap/m/ButtonType',
    'sap/m/OverflowToolbar',
  ],
  (
    // prettier 방지용 주석
    Button,
    ButtonType,
    OverflowToolbar
  ) => {
    'use strict';

    /**
    <OverflowToolbar>
      <Button text="{i18n>LABEL_00121}" type="Emphasized" press=".onPressRequestApproval" />
    </OverflowToolbar>
     */
    return OverflowToolbar.extend('sap.ui.yesco.control.mobile.ApprovalRequestListFooterToolbar', {
      metadata: {
        properties: {
          requestNew: { type: 'boolean', group: 'Misc', defaultValue: true },
          requestNewEnabled: { type: 'boolean', group: 'Misc', defaultValue: true },
          requestNewVisible: { type: 'boolean', group: 'Misc', defaultValue: true },
        },
        events: {
          pressRequestNew: {},
        },
      },

      renderer: {},

      /**
       * @override
       */
      constructor: function (...aArgs) {
        OverflowToolbar.apply(this, aArgs);

        if (this.getRequestNew()) {
          this.addContent(this.getRequestNewButton());
        }
      },

      /**
       * <Button text="{i18n>LABEL_00121}" type="Emphasized" press=".onPressRequestApproval" />
       */
      getRequestNewButton() {
        return new Button({
          text: '{i18n>LABEL_00121}', // 신청
          type: ButtonType.Emphasized,
          enabled: this.getRequestNewEnabled(),
          visible: this.getRequestNewVisible(),
          press: this.firePressRequestNew.bind(this),
        });
      },
    });
  }
);
