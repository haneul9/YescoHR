sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/m/CustomListItem',
    'sap/m/FlexItemData',
    'sap/m/HBox',
    'sap/m/Image',
    'sap/m/ImageMode',
    'sap/m/Link',
    'sap/m/List',
    'sap/m/ListType',
    'sap/m/Text',
    'sap/m/VBox',
  ],
  (
    // prettier 방지용 주석
    CustomListItem,
    FlexItemData,
    HBox,
    Image,
    ImageMode,
    Link,
    List,
    ListType,
    Text,
    VBox
  ) => {
    'use strict';

    return List.extend('sap.ui.yesco.control.MobileEmployeeList', {
      metadata: {
        properties: {
          photo: { type: 'string', group: 'Misc', defaultValue: '' },
          name: { type: 'string', group: 'Misc', defaultValue: '' },
          rank: { type: 'string', group: 'Misc', defaultValue: '' }, // 직급
          duty: { type: 'string', group: 'Misc', defaultValue: '' }, // 직책
          department: { type: 'string', group: 'Misc', defaultValue: '' },
          linkType: { type: 'string', group: 'Misc', defaultValue: '' }, // tel | href | press
          href: { type: 'string', group: 'Misc', defaultValue: '' }, // linkType === 'tel' | linkType === 'href'
          press: { type: 'string', group: 'Misc', defaultValue: '' }, // linkType === 'press'
          doubleLine: { type: 'boolean', group: 'Appearance', defaultValue: false },
        },
      },

      renderer: {},

      /**
       * @override
       */
      constructor: function (...aArgs) {
        List.apply(this, aArgs);

        let oPhoto, oName, oRankDuty, oDepartment;

        const fItemPress = this.getItemPress();
        if (fItemPress) {
          oPhoto = new Image({
            src: `{${this.getPhoto()}}`,
            mode: ImageMode.Background,
            layoutData: new FlexItemData({ styleClass: 'employee-photo' }),
          });

          oName = new Text({
            text: `{${this.getName()}}`,
            wrapping: false,
            layoutData: new FlexItemData({ styleClass: 'employee-name' }),
          });

          oRankDuty = new Text({
            text: this.getRankDutyBindable(),
            wrapping: false,
            layoutData: new FlexItemData({ styleClass: 'employee-position' }),
          });

          oDepartment = new Text({
            text: `{${this.getDepartment()}}`,
            wrapping: false,
            layoutData: new FlexItemData({ styleClass: 'employee-department' }),
          });
        } else {
          oPhoto = new Image({
            src: `{${this.getPhoto()}}`,
            mode: ImageMode.Background,
            layoutData: new FlexItemData({ styleClass: 'employee-photo' }),
          });

          oName = new Link({
            text: `{${this.getName()}}`,
            wrapping: false,
            layoutData: new FlexItemData({ styleClass: 'employee-name' }),
          });

          oRankDuty = new Link({
            text: this.getRankDutyBindable(),
            wrapping: false,
            layoutData: new FlexItemData({ styleClass: 'employee-position' }),
          });

          oDepartment = new Link({
            text: `{${this.getDepartment()}}`,
            wrapping: false,
            layoutData: new FlexItemData({ styleClass: 'employee-department' }),
          });

          const sHref = this.getHref();
          if (sHref) {
            const sLinkType = this.getLinkType();
            if (sLinkType === 'tel') {
              const sHrefBindable = `tel:{${sHref}}`;
              const sEnabled = `{= !!\${${sHref}} }`;

              oName.bindProperty('href', sHrefBindable);
              oName.bindProperty('enabled', sEnabled);

              oRankDuty.bindProperty('href', sHrefBindable);
              oRankDuty.bindProperty('enabled', sEnabled);

              oDepartment.bindProperty('href', sHrefBindable);
              oDepartment.bindProperty('enabled', sEnabled);
            } else if (sLinkType === 'press') {
              const fPress = this.getPress();
              if (fPress) {
                oPhoto.attachEvent('press', this.getListener()[fPress]);
                oName.attachEvent('press', this.getListener()[fPress]);
                oRankDuty.attachEvent('press', this.getListener()[fPress]);
                oDepartment.attachEvent('press', this.getListener()[fPress]);
              }
            } else {
              const sHrefBindable = `{${sHref}}`;
              oName.bindProperty('href', sHrefBindable);
              oRankDuty.bindProperty('href', sHrefBindable);
              oDepartment.bindProperty('href', sHrefBindable);
            }
          }
        }

        const bDoubleLine = this.getDoubleLine();
        const aContent = bDoubleLine ? [oPhoto, oName, new VBox({ items: [oRankDuty, oDepartment] })] : [oPhoto, oName, oRankDuty, oDepartment];

        const aItemsTemplate = this.getBindingInfo('items').template;
        const oHBox = new HBox({
          items: aContent.concat(aItemsTemplate.removeAllContent()),
        });
        aItemsTemplate.addContent(oHBox).setType(ListType.Active);

        this.bindProperty('noDataText', 'i18n>MSG_00001')
          .setRememberSelections(false)
          .addStyleClass(bDoubleLine ? 'employee-list double-line' : 'employee-list');
      },

      getRankDutyBindable() {
        const sRank = this.getRank();
        const sDuty = this.getDuty();
        const sRankBindable = sRank ? `{${sRank}}` : '';
        const sDutyBindable = sDuty ? `{${sDuty}}` : '';
        return `${sRankBindable}/${sDutyBindable}`.replace(/^\/|\/$/g, '');
      },

      getItemPress() {
        return (((this.mEventRegistry || { itemPress: [{ fFunction: null }] }).itemPress || [{ fFunction: null }])[0] || { fFunction: null }).fFunction;
      },

      getListener() {
        return (((this.mEventRegistry || { itemPress: [{ oListener: null }] }).itemPress || [{ oListener: null }])[0] || { oListener: null }).oListener;
      },
    });
  }
);