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
          <Button text="{i18n>LABEL_00121}" type="Emphasized" press=".onPressNewRequest" />
          <Button text="{i18n>LABEL_00131}" icon="sap-icon://print" press=".onPagePrint" />
          <Button text="{i18n>LABEL_00132}" icon="sap-icon://sys-help" press=".onPressHelp" visible="{= !!${menuModel>/current/showHelp} }" />
        </HBox>
      </HBox>
    </VBox>
     */
    return VBox.extend('sap.ui.yesco.control.ApprovalRequestListContentsHeader', {
      metadata: {
        properties: {
          request: { type: 'boolean', group: 'Misc', defaultValue: false },
          print: { type: 'boolean', group: 'Misc', defaultValue: true },
          help: { type: 'boolean', group: 'Misc', defaultValue: true },
        },
        events: {
          pressRequest: {},
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

        if (this.getRequest()) {
          oButtonGroup.addItem(this.getRequestButton());
        }
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
       * <Button text="{i18n>LABEL_00121}" type="Emphasized" press=".onPressRequestApproval" />
       */
      getRequestButton() {
        return new Button({
          text: '{i18n>LABEL_00121}',
          type: ButtonType.Emphasized,
          press: this.firePressRequest.bind(this),
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
