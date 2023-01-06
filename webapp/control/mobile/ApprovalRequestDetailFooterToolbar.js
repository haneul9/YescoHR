sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/m/Button',
    'sap/m/ButtonType',
    'sap/m/HBox',
    'sap/m/OverflowToolbar',
  ],
  (
    // prettier 방지용 주석
    Button,
    ButtonType,
    HBox,
    OverflowToolbar
  ) => {
    'use strict';

    /**
    <OverflowToolbar>
      <HBox class="button-group button-2" visible="{= !${ZappStatAl} }">
        <Button text="{i18n>LABEL_00104}" press=".onPressSave" enabled="{enabled}" />
        <Button text="{i18n>LABEL_00121}" press=".onPressRequestApproval" enabled="{enabled}" />
      </HBox>
      <HBox class="button-group button-3" visible="{= ${ZappStatAl} === '10' }">
        <Button text="{i18n>LABEL_00110}" press=".onPressRemove" enabled="{enabled}" />
        <Button text="{i18n>LABEL_00104}" press=".onPressSave" enabled="{enabled}" />
        <Button text="{i18n>LABEL_00121}" press=".onPressRequestApproval" enabled="{enabled}" />
      </HBox>
      <HBox class="button-group button-1" visible="{= ${ZappStatAl} === '20' }">
        <Button text="{i18n>LABEL_00122}" press=".onPressCancel" enabled="{enabled}" />
      </HBox>
      <HBox class="button-group button-2" visible="{= ${ZappStatAl} === '45' || ${ZappStatAl} === '65' }">
        <Button text="{i18n>LABEL_00110}" press=".onPressRemove" enabled="{enabled}" />
        <Button text="{i18n>LABEL_00120}" press=".onPressRewrite" enabled="{enabled}" />
      </HBox>
    </OverflowToolbar>
     */
    return OverflowToolbar.extend('sap.ui.yesco.control.mobile.ApprovalRequestDetailFooterToolbar', {
      metadata: {
        properties: {
          request: { type: 'boolean', group: 'Misc', defaultValue: false },
          save: { type: 'boolean', group: 'Misc', defaultValue: false },
          remove: { type: 'boolean', group: 'Misc', defaultValue: false },
          cancel: { type: 'boolean', group: 'Misc', defaultValue: false },
          rewrite: { type: 'boolean', group: 'Misc', defaultValue: false },
        },
        events: {
          pressRequest: {},
          pressSave: {},
          pressRemove: {},
          pressCancel: {},
          pressRewrite: {},
        },
      },

      renderer: {},

      /**
       * @override
       */
      constructor: function (...aArgs) {
        OverflowToolbar.apply(this, aArgs);

        // this.bindProperty('visible', '!!${/approvalRequestConfig/showFooter}');

        const oStatus1Box = new HBox({ visible: '{= !${/approvalRequestConfig/status} }' }).addStyleClass('button-group'); // {= !${ZappStatAl} }
        const oStatus2Box = new HBox({ visible: '{= ${/approvalRequestConfig/status} === "10" }' }).addStyleClass('button-group'); // {= ${ZappStatAl} === '10' }
        const oStatus3Box = new HBox({ visible: '{= ${/approvalRequestConfig/status} === "20" }' }).addStyleClass('button-group'); // {= ${ZappStatAl} === '20' }
        const oStatus4Box = new HBox({ visible: '{= ${/approvalRequestConfig/status} === "45" || ${/approvalRequestConfig/status} === "65" }' }).addStyleClass('button-group'); // {= ${ZappStatAl} === '45' || ${ZappStatAl} === '65' }

        // 아래 addItem 순서가 중요하므로 순서 변경 금지

        if (this.getRemove()) {
          oStatus2Box.addItem(this.getRemoveButton());
          oStatus4Box.addItem(this.getRemoveButton());
        }
        if (this.getSave()) {
          oStatus1Box.addItem(this.getSaveButton());
          oStatus2Box.addItem(this.getSaveButton());
        }
        if (this.getRequest()) {
          oStatus1Box.addItem(this.getRequestButton());
          oStatus2Box.addItem(this.getRequestButton());
        }
        if (this.getCancel()) {
          oStatus3Box.addItem(this.getCancelButton());
        }
        if (this.getRewrite()) {
          oStatus4Box.addItem(this.getRewriteButton());
        }

        oStatus1Box.addStyleClass(`button-${oStatus1Box.getItems().length}`);
        oStatus2Box.addStyleClass(`button-${oStatus2Box.getItems().length}`);
        oStatus3Box.addStyleClass(`button-${oStatus3Box.getItems().length}`);
        oStatus4Box.addStyleClass(`button-${oStatus4Box.getItems().length}`);

        this.addContent(oStatus1Box);
        this.addContent(oStatus2Box);
        this.addContent(oStatus3Box);
        this.addContent(oStatus4Box);
      },

      /**
       * <Button text="{i18n>LABEL_00121}" press=".onPressRequestApproval" enabled="{enabled}" />
       */
      getRequestButton() {
        return new Button({
          text: '{i18n>LABEL_00121}',
          visible: '{= ${/approvalRequestConfig/status} === "10" || !${/approvalRequestConfig/status} }',
          enabled: '{/approvalRequestConfig/enabled}',
          press: this.firePressRequest.bind(this),
        });
      },

      /**
       * <Button text="{i18n>LABEL_00104}" press=".onPressSave" enabled="{enabled}" />
       */
      getSaveButton() {
        return new Button({
          text: '{i18n>LABEL_00104}',
          visible: '{= ${/approvalRequestConfig/status} === "10" || !${/approvalRequestConfig/status} }',
          enabled: '{/approvalRequestConfig/enabled}',
          press: this.firePressSave.bind(this),
        });
      },

      /**
       * <Button text="{i18n>LABEL_00110}" press=".onPressRemove" enabled="{enabled}" />
       */
      getRemoveButton() {
        return new Button({
          text: '{i18n>LABEL_00110}',
          visible: '{= ${/approvalRequestConfig/status} === "10" || ${/approvalRequestConfig/status} === "45" || ${/approvalRequestConfig/status} === "65" }',
          enabled: '{/approvalRequestConfig/enabled}',
          press: this.firePressRemove.bind(this),
        });
      },

      /**
       * <Button text="{i18n>LABEL_00122}" press=".onPressCancel" enabled="{enabled}" />
       */
      getCancelButton() {
        return new Button({
          text: '{i18n>LABEL_00122}',
          visible: '{= ${/approvalRequestConfig/status} === "20" }',
          enabled: '{/approvalRequestConfig/enabled}',
          press: this.firePressCancel.bind(this),
        });
      },

      /**
       * <Button text="{i18n>LABEL_00120}" press=".onPressRewrite" enabled="{enabled}" />
       */
      getRewriteButton() {
        return new Button({
          text: '{i18n>LABEL_00120}',
          visible: '{= ${/approvalRequestConfig/status} === "45" || ${/approvalRequestConfig/status} === "65" }',
          enabled: '{/approvalRequestConfig/enabled}',
          press: this.firePressRewrite.bind(this),
        });
      },
    });
  }
);
