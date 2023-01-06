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
          <FlexItemData maxWidth="50%" />
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
          titlePath: { type: 'string', group: 'Misc', defaultValue: 'i18n>LABEL_00129' },
          countLabel: { type: 'string', group: 'Misc', defaultValue: 'total' },
          countPath: { type: 'string', group: 'Misc', defaultValue: null },
          infoMessagePath: { type: 'string', group: 'Misc', defaultValue: null },
          useInfoIcon: { type: 'boolean', group: 'Misc', defaultValue: true },
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
        oHeaderBox.addItem(
          new CustomTitle({
            text: `{${this.getTitlePath()}}`,
            headerTitle: true,
          })
        );

        // Header total count
        oHeaderBox.addItem(
          new Text({
            text: `${this.getCountLabel()} { path: '${this.getCountPath()}', type: 'sap.ui.yesco.mvc.model.type.Currency' }`,
            layoutData: new FlexItemData({ styleClass: 'header-count' }),
          })
        );

        // Header info message
        const sInfoMessagePath = this.getInfoMessagePath();
        if (sInfoMessagePath) {
          oHeaderBox.addItem(
            new Link({
              text: `{${sInfoMessagePath}}`,
              subtle: true,
              press: this.firePressInfoMessage.bind(this),
              layoutData: new FlexItemData({ maxWidth: '50%' }),
            }).addStyleClass('desc-txt')
          );
        }

        this.setJustifyContent(FlexJustifyContent.SpaceBetween) // prettier 방지용 주석
          .addStyleClass('header-wrap')
          .addItem(oHeaderBox);

        // Header info icon
        const bUseInfoIcon = this.getUseInfoIcon();
        if (bUseInfoIcon) {
          this.addItem(
            new Image({
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
            })
          );
        }
      },

      callEventHandler(oEvent, [{ oListener, fFunction }]) {
        fFunction.call(oListener, oEvent);
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
