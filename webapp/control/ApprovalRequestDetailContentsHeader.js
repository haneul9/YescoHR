sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/m/Button',
    'sap/m/ButtonType',
    'sap/m/FlexJustifyContent',
    'sap/m/HBox',
    'sap/m/VBox',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/control/Breadcrumbs',
  ],
  (
    // prettier 방지용 주석
    Button,
    ButtonType,
    FlexJustifyContent,
    HBox,
    VBox,
    AppUtils,
    Breadcrumbs
  ) => {
    ('use strict');

    /**
    <VBox class="contents-header">
      <HBox justifyContent="SpaceBetween" class="breadcrumbs">
        <custom:Breadcrumbs />
        <HBox class="button-group">
          <Button text="{i18n>LABEL_00120}" type="Emphasized" press=".onPressRewrite" visible="{= ${ZappStatAl} === '45' || ${ZappStatAl} === '65' }" enabled="{enabled}" />
          <Button text="{i18n>LABEL_00104}" type="Emphasized" press=".onPressSave" visible="{= ${ZappStatAl} === '10' || !${ZappStatAl} }" enabled="{enabled}" />
          <Button text="{i18n>LABEL_00121}" type="Emphasized" press=".onPressRequestApproval" visible="{= ${ZappStatAl} === '10' || !${ZappStatAl} }" enabled="{enabled}" />
          <Button text="{i18n>LABEL_00110}" type="Reject" press=".onPressRemove" visible="{= ${ZappStatAl} === '10' || ${ZappStatAl} === '45' || ${ZappStatAl} === '65' }" enabled="{enabled}" />
          <Button text="{i18n>LABEL_00146}" press=".onNavBack" />
          <Button text="{i18n>LABEL_00131}" icon="sap-icon://print" press=".onPagePrint" />
          <Button text="{i18n>LABEL_00132}" icon="sap-icon://sys-help" press=".onPressHelp" visible="{= !!${menuModel>/current/showHelp} }" />
        </HBox>
      </HBox>
    </VBox>
     */
    return VBox.extend('sap.ui.yesco.control.ApprovalRequestDetailContentsHeader', {
      metadata: {
        properties: {
          rewrite: { type: 'boolean', group: 'Misc', defaultValue: false },
          save: { type: 'boolean', group: 'Misc', defaultValue: false },
          request: { type: 'boolean', group: 'Misc', defaultValue: false },
          remove: { type: 'boolean', group: 'Misc', defaultValue: false },
          print: { type: 'boolean', group: 'Misc', defaultValue: true },
          help: { type: 'boolean', group: 'Misc', defaultValue: true },
        },
        events: {
          pressRewrite: {},
          pressSave: {},
          pressRequest: {},
          pressRemove: {},
          pressNavBack: {},
          pressPrint: {},
          pressHelp: {},
        },
      },

      renderer: {},

      /**
       * @override
       */
      constructor: function (...aArgs) {
        VBox.apply(this, aArgs);

        const oButtonGroup = new HBox().addStyleClass('button-group');

        if (this.getRewrite()) {
          oButtonGroup.addItem(this.getRewriteButton());
        }
        if (this.getSave()) {
          oButtonGroup.addItem(this.getSaveButton());
        }
        if (this.getRequest()) {
          oButtonGroup.addItem(this.getRequestButton());
        }
        if (this.getRemove()) {
          oButtonGroup.addItem(this.getRemoveButton());
        }
        oButtonGroup.addItem(this.getNavBackButton());
        if (this.getPrint()) {
          oButtonGroup.addItem(this.getPrintButton());
        }
        const bShowHelp = AppUtils.getAppComponent().getMenuModel().getProperty('/current/showHelp');
        if (bShowHelp) {
          oButtonGroup.addItem(this.getHelpButton());
        }

        const oBox = new HBox({ justifyContent: FlexJustifyContent.SpaceBetween }) //
          .addStyleClass('breadcrumbs')
          .addItem(new Breadcrumbs())
          .addItem(oButtonGroup);

        this.addStyleClass('contents-header').addItem(oBox);
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
       * <Button text="{i18n>LABEL_00146}" press=".onNavBack" />
       */
      getNavBackButton() {
        return new Button({
          text: '{i18n>LABEL_00146}',
          press: this.firePressNavBack.bind(this),
        });
      },

      /**
       * <Button text="{i18n>LABEL_00131}" icon="sap-icon://print" press=".onPagePrint" />
       */
      getPrintButton() {
        return new Button({
          text: '{i18n>LABEL_00131}',
          icon: 'sap-icon://print',
          press: this.firePressPrint.bind(this),
        });
      },

      /**
       * <Button text="{i18n>LABEL_00132}" icon="sap-icon://sys-help" press=".onPressHelp" />
       */
      getHelpButton() {
        return new Button({
          text: '{i18n>LABEL_00132}',
          icon: 'sap-icon://sys-help',
          press: this.firePressHelp.bind(this),
        });
      },
    });
  }
);
