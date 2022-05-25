sap.ui.define(
  [
    // prettier 방지용 주석
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
          linkType: { type: 'string', group: 'Misc', defaultValue: '' }, // tel | href
          href: { type: 'string', group: 'Misc', defaultValue: '' },
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

        if (this.hasListeners('itemPress')) {
          oPhoto = new Image({ src: `{${this.getPhoto()}}`, mode: ImageMode.Background });
          oName = new Text({ text: `{${this.getName()}}`, wrapping: false });
          oRankDuty = new Text({ text: this.getRankDutyBindable(), wrapping: false });
          oDepartment = new Text({ text: `{${this.getDepartment()}}`, wrapping: false });
        } else {
          oPhoto = new Image({ src: `{${this.getPhoto()}}`, mode: ImageMode.Background });
          oName = new Link({ text: `{${this.getName()}}`, wrapping: false });
          oRankDuty = new Link({ text: this.getRankDutyBindable(), wrapping: false });
          oDepartment = new Link({ text: `{${this.getDepartment()}}`, wrapping: false });

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
            } else {
              const sHrefBindable = `{${sHref}}`;
              oName.bindProperty('href', sHrefBindable);
              oRankDuty.bindProperty('href', sHrefBindable);
              oDepartment.bindProperty('href', sHrefBindable);
            }
          }
        }

        const bDoubleLine = this.getDoubleLine();
        const aItemsTemplate = this.getBindingInfo('items').template;
        const aDefaultItems = bDoubleLine ? [oPhoto, oName, new VBox({ items: [oRankDuty, oDepartment] })] : [oPhoto, oName, oRankDuty, oDepartment];
        const oHBox = new HBox({ items: aDefaultItems.concat(aItemsTemplate.removeAllContent()) });

        aItemsTemplate.addContent(oHBox).setType(ListType.Active);

        this.bindProperty('noDataText', 'i18n>MSG_00001')
          .setRememberSelections(false)
          .addStyleClass(bDoubleLine ? 'employee-list double-line' : 'employee-list single-line');
      },

      getRankDutyBindable() {
        const sRank = this.getRank();
        const sDuty = this.getDuty();
        const sRankBindable = sRank ? `{${sRank}}` : '';
        const sDutyBindable = sDuty ? `{${sDuty}}` : '';
        return `${sRankBindable}/${sDutyBindable}`.replace(/^\/|\/$/g, '');
      },

      // getItemPress() {
      //   return (((this.mEventRegistry || { itemPress: [{ fFunction: null }] }).itemPress || [{ fFunction: null }])[0] || { fFunction: null }).fFunction;
      // },

      // getListener() {
      //   return (((this.mEventRegistry || { itemPress: [{ oListener: null }] }).itemPress || [{ oListener: null }])[0] || { oListener: null }).oListener;
      // },
    });
  }
);
