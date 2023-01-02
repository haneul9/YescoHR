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
    <OverflowToolbar visible="{= !!${/ReWriteBtn} || ${ZappStatAl} !== '30' &amp;&amp; ${ZappStatAl} !== '40' &amp;&amp; ${ZappStatAl} !== '60' }">
      <Button text="{i18n>LABEL_00120}" type="Emphasized" press=".onPressRewrite" visible="{= ${ZappStatAl} === '45' || ${ZappStatAl} === '65' }" enabled="{enabled}" />
      <Button text="{i18n>LABEL_00104}" type="Emphasized" press=".onPressSave" visible="{= ${ZappStatAl} === '10' || !${ZappStatAl} }" enabled="{enabled}" />
      <Button text="{i18n>LABEL_00121}" type="Emphasized" press=".onPressRequestApproval" visible="{= ${ZappStatAl} === '10' || !${ZappStatAl} }" enabled="{enabled}" />
      <Button text="{i18n>LABEL_00110}" type="Reject" press=".onPressRemove" visible="{= ${ZappStatAl} === '10' || ${ZappStatAl} === '45' || ${ZappStatAl} === '65' }" enabled="{enabled}" />
      <Button text="{i18n>LABEL_00122}" type="Reject" press=".onPressCancel" visible="{= ${ZappStatAl} === '20' }" enabled="{enabled}" />
    </OverflowToolbar>
     */
    return OverflowToolbar.extend('sap.ui.yesco.control.mobile.ApprovalRequestDetailFooterToolbar', {
      metadata: {
        properties: {
          rewrite: { type: 'boolean', group: 'Misc', defaultValue: false },
          save: { type: 'boolean', group: 'Misc', defaultValue: false },
          request: { type: 'boolean', group: 'Misc', defaultValue: false },
          remove: { type: 'boolean', group: 'Misc', defaultValue: false },
          cancel: { type: 'boolean', group: 'Misc', defaultValue: false },
        },
        events: {
          pressRewrite: {},
          pressSave: {},
          pressRequest: {},
          pressRemove: {},
          pressCancel: {},
        },
      },

      renderer: {},

      /**
       * @override
       */
      constructor: function (...aArgs) {
        OverflowToolbar.apply(this, aArgs);

        this.bindProperty('visible', '!!${/approvalRequestConfig/showFooter}');

        if (this.getRemove()) {
          this.addContent(this.getRemoveButton());
        }
        if (this.getCancel()) {
          this.addContent(this.getCancelButton());
        }
        if (this.getRewrite()) {
          this.addContent(this.getRewriteButton());
        }
        if (this.getSave()) {
          this.addContent(this.getSaveButton());
        }
        if (this.getRequest()) {
          this.addContent(this.getRequestButton());
        }
      },

      /**
       * <Button text="{i18n>LABEL_00110}" type="Reject" press=".onPressRemove" visible="{= ${ZappStatAl} === '10' || ${ZappStatAl} === '45' || ${ZappStatAl} === '65' }" enabled="{enabled}" />
       */
      getRemoveButton() {
        return new Button({
          text: '{i18n>LABEL_00110}',
          type: ButtonType.Reject,
          visible: '{= ${/approvalRequestConfig/status} === "10" || ${/approvalRequestConfig/status} === "45" || ${/approvalRequestConfig/status} === "65" }',
          enabled: '{/approvalRequestConfig/enabled}',
          press: this.firePressRemove.bind(this),
        });
      },

      /**
       * <Button text="{i18n>LABEL_00122}" type="Reject" press=".onPressCancel" visible="{= ${ZappStatAl} === '20' }" enabled="{enabled}" />
       */
      getCancelButton() {
        return new Button({
          text: '{i18n>LABEL_00122}',
          type: ButtonType.Reject,
          visible: '{= ${/approvalRequestConfig/status} === "20" }',
          enabled: '{/approvalRequestConfig/enabled}',
          press: this.firePressCancel.bind(this),
        });
      },

      /**
       * <Button text="{i18n>LABEL_00120}" type="Emphasized" press=".onPressRewrite" visible="{= ${ZappStatAl} === '45' }" enabled="{enabled}" />
       */
      getRewriteButton() {
        return new Button({
          text: '{i18n>LABEL_00120}',
          type: ButtonType.Emphasized,
          visible: '{= ${/approvalRequestConfig/status} === "45" || ${/approvalRequestConfig/status} === "65" }',
          enabled: '{/approvalRequestConfig/enabled}',
          press: this.firePressRewrite.bind(this),
        });
      },

      /**
       * <Button text="{i18n>LABEL_00104}" type="Emphasized" press=".onPressSave" visible="{= ${ZappStatAl} === '10' || !${ZappStatAl} }" enabled="{enabled}" />
       */
      getSaveButton() {
        return new Button({
          text: '{i18n>LABEL_00104}',
          type: ButtonType.Emphasized,
          visible: '{= ${/approvalRequestConfig/status} === "10" || !${/approvalRequestConfig/status} }',
          enabled: '{/approvalRequestConfig/enabled}',
          press: this.firePressSave.bind(this),
        });
      },

      /**
       * <Button text="{i18n>LABEL_00121}" type="Emphasized" press=".onPressRequestApproval" visible="{= ${ZappStatAl} === '10' || !${ZappStatAl} }" enabled="{enabled}" />
       */
      getRequestButton() {
        return new Button({
          text: '{i18n>LABEL_00121}',
          type: ButtonType.Emphasized,
          visible: '{= ${/approvalRequestConfig/status} === "10" || !${/approvalRequestConfig/status} }',
          enabled: '{/approvalRequestConfig/enabled}',
          press: this.firePressRequest.bind(this),
        });
      },
    });
  }
);
