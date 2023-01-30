sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/m/FlexItemData',
    'sap/m/HBox',
    'sap/m/Text',
    'sap/ui/core/TitleLevel',
    'sap/ui/yesco/control/Title',
  ],
  (
    // prettier 방지용 주석
    FlexItemData,
    HBox,
    Text,
    TitleLevel,
    CustomTitle
  ) => {
    'use strict';

    /**
    <HBox class="header">
      <custom:Title text="{i18n>LABEL_00129}">
        <custom:layoutData>
          <FlexItemData styleClass="header-title" />
        </custom:layoutData>
      </custom:Title>
      <Text text="total { path: '/listInfo/totalCount', type: 'sap.ui.yesco.mvc.model.type.Currency' }">
        <layoutData>
          <FlexItemData styleClass="header-count" />
        </layoutData>
      </Text>
      <Text text="{/listInfo/infoMessage}" visible="{= !!${/listInfo/infoMessage} }" class="desc-txt">
        <layoutData>
          <FlexItemData styleClass="header-description" />
        </layoutData>
      </Text>
    </HBox>
     */
    return HBox.extend('sap.ui.yesco.control.HeaderTitleCountMessage', {
      metadata: {
        properties: {
          title: { type: 'string', group: 'Misc', defaultValue: null }, // i18n 또는 hard coding
          titlePath: { type: 'string', group: 'Misc', defaultValue: null }, // model path만 입력
          titleLevel: { type: 'string', group: 'Misc', defaultValue: TitleLevel.H2 },
          titleVisible: { type: 'string', group: 'Misc', defaultValue: null },
          countLabel: { type: 'string', group: 'Misc', defaultValue: 'total' },
          countPath: { type: 'string', group: 'Misc', defaultValue: null },
          countVisible: { type: 'string', group: 'Misc', defaultValue: null },
          infoMessage: { type: 'string', group: 'Misc', defaultValue: null },
          infoMessagePath: { type: 'string', group: 'Misc', defaultValue: null },
          infoMessageUnderline: { type: 'boolean', group: 'Misc', defaultValue: true },
          infoMessageVisible: { type: 'string', group: 'Misc', defaultValue: null },
        },
      },

      renderer: {},

      constructor: function (...aArgs) {
        HBox.apply(this, aArgs);

        // Header title
        this.addItem(this.getTitleControl());

        // Header total count
        const oCountTextControl = this.getCountTextControl();
        if (oCountTextControl) {
          this.addItem(oCountTextControl);
        }

        // Header info message
        const oInfoMessageTextControl = this.getInfoMessageTextControl();
        if (oInfoMessageTextControl) {
          this.addItem(oInfoMessageTextControl);
        }
      },

      onAfterRendering(...aArgs) {
        HBox.prototype.onAfterRendering.apply(this, aArgs);

        if (!this.hasStyleClass('header') && !this.hasStyleClass('title')) {
          this.addStyleClass('header');
        }
      },

      // Header title
      getTitleControl() {
        const mSettings = {
          level: this.getTitleLevel(),
          headerTitle: true,
        };

        const sTitlePath = this.getTitlePath();
        if (sTitlePath) {
          mSettings.text = `{= \${${sTitlePath}} || \${i18n>LABEL_00129} }`; // 신청내역
        } else {
          mSettings.text = this.getTitle();
        }

        const sVisible = this.getTitleVisible();
        if (sVisible) {
          mSettings.visible = this.toBoolean(sVisible); // bindProperty function에는 {}없이 경로를 바로 입력
        }

        return new CustomTitle(mSettings);
      },

      // Header total count
      getCountTextControl() {
        const sCountPath = this.getCountPath();
        if (!sCountPath) {
          return null;
        }

        const mSettings = {
          text: `${this.getCountLabel()} { path: '${sCountPath}', type: 'sap.ui.yesco.mvc.model.type.Currency' }`,
          layoutData: new FlexItemData({ styleClass: 'header-count' }),
        };

        const sVisible = this.getCountVisible();
        if (sVisible) {
          mSettings.visible = this.toBoolean(sVisible);
        }

        return new Text(mSettings);
      },

      // Header info message
      getInfoMessageTextControl() {
        let sText;
        const sInfoMessagePath = this.getInfoMessagePath();
        if (sInfoMessagePath) {
          sText = `{${sInfoMessagePath}}`;
        } else {
          sText = this.getInfoMessage();
        }
        if (!sText) {
          return null;
        }

        const mSettings = {
          text: sText,
          layoutData: new FlexItemData({ styleClass: 'header-description' }),
        };

        const sVisible = this.getInfoMessageVisible();
        if (sVisible) {
          mSettings.visible = this.toBoolean(sVisible);
        }

        const oControl = new Text(mSettings);

        const sInfoMessageUnderline = this.getInfoMessageUnderline();
        if (sInfoMessageUnderline) {
          oControl.addStyleClass('desc-txt ml-0');
        }

        return oControl;
      },

      toExpression(sVisible) {
        return (sVisible || '').replace(/\[/g, '{').replace(/\]/g, '}');
      },

      toBoolean(sVisible) {
        const sExpression = this.toExpression(sVisible);
        return sExpression === 'true' ? true : sExpression === 'false' ? false : sExpression;
      },
    });
  }
);
