sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/m/Button',
    'sap/m/HBox',
    'sap/m/OverflowToolbar',
  ],
  (
    // prettier 방지용 주석
    Button,
    HBox,
    OverflowToolbar
  ) => {
    'use strict';

    /**
    <OverflowToolbar>
      <HBox class="button-group button-1">
        <Button text="{i18n>LABEL_00121}" press=".onPressRequestApproval" />
      </HBox>
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
          this.addContent(
            new HBox({
              items: [this.getRequestNewButton()],
            }).addStyleClass('button-group button-1')
          );
        }
      },

      /**
       * <Button text="{i18n>LABEL_00121}" press=".onPressRequestApproval" />
       */
      getRequestNewButton() {
        return new Button({
          text: '{i18n>LABEL_00121}', // 신청
          enabled: this.getRequestNewEnabled(),
          visible: this.getRequestNewVisible(),
          press: this.firePressRequestNew.bind(this),
        });
      },
    });
  }
);
