sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/m/FlexItemData',
    'sap/m/FlexJustifyContent',
    'sap/m/HBox',
    'sap/m/Image',
    'sap/m/ImageMode',
    'sap/m/Link',
    'sap/m/Text',
    'sap/ui/core/Fragment',
    'sap/ui/core/TitleLevel',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/control/Title',
  ],
  (
    // prettier 방지용 주석
    FlexItemData,
    FlexJustifyContent,
    HBox,
    Image,
    ImageMode,
    Link,
    Text,
    Fragment,
    TitleLevel,
    JSONModel,
    CustomTitle
  ) => {
    'use strict';

    /**
  <HBox justifyContent="SpaceBetween" class="header-wrap">
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
      <Link text="{/listInfo/infoMessage}" visible="{= !!${/listInfo/infoMessage} }" class="desc-txt" subtle="true" press=".onPressMobileInfoMessage">
        <layoutData>
          <FlexItemData maxWidth="50%" styleClass="header-description" />
        </layoutData>
      </Link>
    </HBox>
    <Image src="/sap/public/bc/ui2/zui5_yescohr/images/icon_tooltip.svg" press=".openMobileCommonListStatusPop" visible="{/listInfo/Popover}" width="16px" height="16px" mode="Background" backgroundPosition="center center" backgroundSize="auto">
      <layoutData>
        <FlexItemData styleClass="header-info-icon" />
      </layoutData>
    </Image>
  </HBox>
     */
    return HBox.extend('sap.ui.yesco.control.mobile.HeaderTitleCountStatus', {
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
          infoIconVisible: { type: 'string', group: 'Misc', defaultValue: null },
        },
        events: {
          pressInfoIcon: {},
        },
      },

      renderer: {},

      constructor: function (...aArgs) {
        HBox.apply(this, aArgs);

        const oHeaderBox = new HBox().addStyleClass('header');

        // Header title
        oHeaderBox.addItem(this.getTitleControl());

        // Header total count
        const oCountTextControl = this.getCountTextControl();
        if (oCountTextControl) {
          oHeaderBox.addItem(oCountTextControl);
        }

        // Header info message
        const oInfoMessageLinkControl = this.getInfoMessageLinkControl();
        if (oInfoMessageLinkControl) {
          oHeaderBox.addItem(oInfoMessageLinkControl);
        }

        this.setJustifyContent(FlexJustifyContent.SpaceBetween) // prettier 방지용 주석
          .addStyleClass('header-wrap')
          .addItem(oHeaderBox);

        // Header info icon
        const oInfoIconControl = this.getInfoIconControl();
        if (oInfoIconControl) {
          this.addItem(oInfoIconControl);
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
      getInfoMessageLinkControl() {
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
          subtle: true,
          press: this.firePressInfoMessage.bind(this),
          layoutData: new FlexItemData({ styleClass: 'header-description' }),
        };

        const sVisible = this.getInfoMessageVisible();
        if (sVisible) {
          mSettings.visible = this.toBoolean(sVisible);
        }

        const oControl = new Link(mSettings);

        const sInfoMessageUnderline = this.getInfoMessageUnderline();
        if (sInfoMessageUnderline) {
          oControl.addStyleClass('desc-txt ml-0');
        }

        return oControl;
      },

      async firePressInfoMessage(oEvent) {
        if (this.oInfoMessagePopover && this.oInfoMessagePopover.isOpen()) {
          this.oInfoMessagePopover.close();
        } else {
          const oLink = oEvent.getSource();
          const sInfoMessage = oLink.getProperty('text');

          if (!this.oInfoMessagePopover) {
            this.oInfoMessagePopover = await Fragment.load({
              name: 'sap.ui.yesco.fragment.mobile.InfoMessagePopover',
              controller: this,
            });

            this.oInfoMessagePopover.setModel(new JSONModel({ listInfo: { infoMessage: null } }));
          }

          this.oInfoMessagePopover.getModel().setProperty('/listInfo/infoMessage', sInfoMessage);
          this.oInfoMessagePopover.openBy(oLink);
        }
      },

      getInfoIconControl() {
        const mSettings = {
          src: '/sap/public/bc/ui2/zui5_yescohr/images/icon_tooltip.svg',
          width: '16px',
          height: '16px',
          mode: ImageMode.Background,
          backgroundPosition: 'center center',
          backgroundSize: 'auto',
          press: (oEvent) => {
            this.callEventHandler(oEvent, oEvent.oSource.oParent.mEventRegistry.pressInfoIcon);
          },
          layoutData: new FlexItemData({ styleClass: 'header-info-icon' }),
        };

        const sVisible = this.getInfoIconVisible();
        if (sVisible) {
          mSettings.visible = this.toBoolean(sVisible);
        }

        return new Image(mSettings);
      },

      callEventHandler(oEvent, [{ oListener, fFunction }]) {
        fFunction.call(oListener, oEvent);
      },

      toExpression(sVisible) {
        return (sVisible || '').replace(/\[/g, '{').replace(/\]/g, '}');
      },

      toBoolean(sVisible) {
        const sExpression = this.toExpression(sVisible);
        return sExpression === 'true' ? true : sExpression === 'false' ? false : sExpression;
      },

      /**
       * @override
       * @param {boolean} [bSuppressInvalidate] if true, the UI element is removed from DOM synchronously and parent will not be invalidated.
       */
      // eslint-disable-next-line no-unused-vars
      destroy(bSuppressInvalidate) {
        if (this.oInfoMessagePopover) {
          this.oInfoMessagePopover.destroy();
        }

        HBox.prototype.destroy.apply(this, arguments);
      },
    });
  }
);
