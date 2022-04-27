sap.ui.define(
  [
    //
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/exceptions/UI5Error',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    //
    AppUtils,
    UI5Error,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.talent.mobile.Compare', {
      initializeModel() {
        return {
          busy: false,
          isLoaded: false,
          compare: {
            data: [
              {
                colorSet: 'ColorSet1',
                align: 'Center',
                value01: [{ label: '' }],
                value02: [{ label: this.getBundleText('LABEL_35013') }],
                value03: [{ label: this.getBundleText('LABEL_35015') }],
                value04: [{ label: this.getBundleText('LABEL_00222') }],
                value05: [{ label: this.getBundleText('LABEL_35016') }],
                value06: [{ label: this.getBundleText('LABEL_35014') }],
                value07: null,
                value08: [{ label: this.getBundleText('LABEL_35018') }],
                value09: [{ label: this.getBundleText('LABEL_35017') }],
                value10: [{ label: this.getBundleText('LABEL_35019') }],
                value11: [{ label: this.getBundleText('LABEL_35020') }],
              },
            ],
          },
        };
      },

      bindScrollSync() {
        setTimeout(() => {
          const oBlockLayout = this.byId('BlockLayout');
          const sBlockId = oBlockLayout.getId();
          const $lastBlock = $(`#${sBlockId} > div`);

          $lastBlock.each(function () {
            $(this).off('scroll touchmove mousewheel');
          });

          $lastBlock.each(function () {
            $(this).on('scroll touchmove mousewheel', function () {
              const iScrollLeft = $(this).scrollLeft();

              $lastBlock.not(this).each(function () {
                $(this).scrollLeft(iScrollLeft);
              });
            });
          });
        }, 300);
      },

      async onObjectMatched(oParameter) {
        const oViewModel = this.getViewModel();
        const bIsLoaded = oViewModel.getProperty('/isLoaded');

        if (bIsLoaded) {
          this.bindScrollSync();

          return;
        }

        oViewModel.setData(this.initializeModel());
        oViewModel.setProperty('/busy', true);

        try {
          if (_.isEmpty(oParameter.pernrs)) throw new UI5Error({ code: 'A', message: this.getBundleText('MSG_00043') }); // 잘못된 접근입니다.

          const aPernr = _.split(oParameter.pernrs, '|');
          const aCompareResults = await Client.getEntitySet(this.getModel(ServiceNames.PA), 'TalentSearchComparison', { Pernr: aPernr });

          const aCompareData = oViewModel.getProperty('/compare/data');
          const sUnknownAvatarImageURL = this.getUnknownAvatarImageURL();

          oViewModel.setProperty(
            '/compare/data',
            _.chain(aCompareData)
              .concat(
                _.map(aCompareResults, (o, i) => {
                  return {
                    colorSet: i % 2 === 0 ? 'ColorSet2' : 'ColorSet1',
                    align: 'Start',
                    value01: [{ pernr: o.Pernr, image: _.isEmpty(o.Picurl) ? sUnknownAvatarImageURL : o.Picurl }, { text: _.chain(o.Value01).split(' ').join('\n').value() }],
                    value02: this.convertCompareRow(o, 'Value02'),
                    value03: this.convertCompareRow(o, 'Value03'),
                    value04: this.convertCompareRow(o, 'Value04'),
                    value05: this.convertCompareRow(o, 'Value05'),
                    value06: this.convertCompareRow(o, 'Value06'),
                    value07: o.Value07 || '0',
                    value08: this.convertCompareRow(o, 'Value08'),
                    value09: this.convertCompareRow(o, 'Value09'),
                    value10: this.convertCompareRow(o, 'Value10'),
                    value11: this.convertCompareRow(o, 'Value11'),
                  };
                })
              )
              .value()
          );
        } catch (oError) {
          this.debug('Controller > Talent-Compare Mobile > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        } finally {
          setTimeout(() => oViewModel.setProperty('/busy', false), 200);
          this.bindScrollSync();

          this.getView().addEventDelegate({
            onBeforeHide: (evt) => {
              if (!_.endsWith(evt.toId, 'employee')) oViewModel.setProperty('/isLoaded', false);
            },
          });
        }
      },

      convertCompareRow(mRowData, sTargetProp) {
        return _.chain(mRowData)
          .get(sTargetProp)
          .split('<br>')
          .map((d) => ({ text: d }))
          .value();
      },

      onPressPic(oEvent) {
        const mRowData = oEvent.getSource().getParent().getBindingContext().getObject();

        this.navEmployee(mRowData.pernr);
      },

      navEmployee(sPernr) {
        if (!sPernr) return;

        this.getViewModel().setProperty('/isLoaded', true);
        this.getRouter().navTo('mobile/employee', { pernr: sPernr });
      },
    });
  }
);
