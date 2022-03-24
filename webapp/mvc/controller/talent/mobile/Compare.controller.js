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

      async onObjectMatched(oParameter) {
        const oViewModel = this.getViewModel();

        oViewModel.setData(this.initializeModel());
        oViewModel.setProperty('/busy', true);

        try {
          if (_.isEmpty(oParameter.pernrs)) throw new UI5Error({ code: 'A', message: this.getBundleText('MSG_00043') }); // 잘못된 접근입니다.

          const aPernr = _.split(oParameter.pernrs, '|');
          const aCompareResults = await Client.getEntitySet(this.getModel(ServiceNames.PA), 'TalentSearchComparison', { Pernr: aPernr });

          const aCompareData = oViewModel.getProperty('/compare/data');

          oViewModel.setProperty(
            '/compare/data',
            _.chain(aCompareData)
              .concat(
                _.map(aCompareResults, (o, i) => {
                  return {
                    colorSet: i % 2 === 0 ? 'ColorSet2' : 'ColorSet1',
                    align: 'Start',
                    value01: [{ image: _.isEmpty(o.Picurl) ? 'asset/image/avatar-unknown.svg' : o.Picurl }, { text: o.Value01 }],
                    value02: _.chain(o.Value02)
                      .split('<br>')
                      .map((d) => ({ text: d }))
                      .value(),
                    value03: _.chain(o.Value03)
                      .split('<br>')
                      .map((d) => ({ text: d }))
                      .value(),
                    value04: _.chain(o.Value04)
                      .split('<br>')
                      .map((d) => ({ text: d }))
                      .value(),
                    value05: _.chain(o.Value05)
                      .split('<br>')
                      .map((d) => ({ text: d }))
                      .value(),
                    value06: _.chain(o.Value06)
                      .split('<br>')
                      .map((d) => ({ text: d }))
                      .value(),
                    value07: o.Value07,
                    value08: _.chain(o.Value08)
                      .split('<br>')
                      .map((d) => ({ text: d }))
                      .value(),
                    value09: _.chain(o.Value09)
                      .split('<br>')
                      .map((d) => ({ text: d }))
                      .value(),
                    value10: _.chain(o.Value10)
                      .split('<br>')
                      .map((d) => ({ text: d }))
                      .value(),
                    value11: _.chain(o.Value11)
                      .split('<br>')
                      .map((d) => ({ text: d }))
                      .value(),
                  };
                })
              )
              .concat({
                colorSet: 'ColorSet1',
                align: 'Start',
                value01: [],
                value02: [],
                value03: [],
                value04: [],
                value05: [],
                value06: [],
                value07: null,
                value08: [],
                value09: [],
                value10: [],
                value11: [],
              })
              .value()
          );
        } catch (oError) {
          this.debug('Controller > Talent-Compare Mobile > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        } finally {
          setTimeout(() => oViewModel.setProperty('/busy', false), 200);
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
        }
      },
    });
  }
);
