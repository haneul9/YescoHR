/* eslint-disable no-useless-call */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/exceptions/UI5Error',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/exceptions/ODataReadError',
    'sap/ui/yesco/common/exceptions/ODataCreateError',
    'sap/ui/yesco/common/exceptions/ODataDeleteError',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    Filter,
    FilterOperator,
    MessageBox,
    Appno,
    AppUtils,
    ComboEntry,
    UI5Error,
    Client,
    ServiceNames,
    ODataReadError,
    ODataCreateError,
    ODataDeleteError,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.clubJoin.ClubJoinDetail', {
      LIST_PAGE_ID: { E: 'container-ehr---clubJoin', H: 'container-ehr---h_clubJoin' },

      initializeModel() {
        return {
          menid: '',
          ViewKey: '',
          FormData: {},
          baseArea: {},
          loanAmount: {},
          LaonType: [],
          AssuranceType: [],
          HouseType: [],
          Settings: {},
          RepayList: [],
          RepayHisList: [],
          RepayHisLength: 1,
          hisBusy: false,
          busy: false,
        };
      },

      async onObjectMatched(oParameter) {
        const sDataKey = oParameter.oDataKey;
        const sMenid = this.getCurrentMenuId();
        const oViewModel = this.getViewModel();

        oViewModel.setData(this.initializeModel());
        oViewModel.setProperty('/busy', true);
        oViewModel.setProperty('/menid', sMenid);
        oViewModel.setProperty('/ViewKey', sDataKey);

        try {
          // Input Field Imited
          oViewModel.setProperty('/FieldLimit', _.assignIn(this.getEntityLimit(ServiceNames.BENEFIT, 'ClubJoinAppl')));

          const aList = await this.getList();

          oViewModel.setProperty('/ClubType', new ComboEntry({ codeKey: 'Zclub', valueKey: 'Zclubtx', aEntries: aList }));
          this.setFormData();
        } catch (oError) {
          if (oError instanceof Error) oError = new UI5Error({ message: this.getBundleText('MSG_00043') }); // 잘못된 접근입니다.

          this.debug(oError);
          AppUtils.handleError(oError, {
            onClose: () => {
              this.getRouter().navTo(oViewModel.getProperty('/previousName'));
            },
          });
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      getCurrentLocationText(oArguments) {
        const sAction = oArguments.oDataKey === 'N' ? this.getBundleText('LABEL_04002') : this.getBundleText('LABEL_00165');

        return sAction;
      },

      // 상세조회
      async setFormData() {
        const oView = this.getView();
        const oViewModel = this.getViewModel();
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const sViewKey = oViewModel.getProperty('/ViewKey');
        const mPernr = this.isHass() ? { Pernr: this.getAppointeeProperty('Pernr') } : {};
        const mListData = await Client.getEntitySet(oModel, 'BenefitCodeList', {
          ...mPernr,
          Werks: this.getAppointeeProperty('Werks'),
          Cdnum: 'BE0018',
          Grcod: 'BE000030',
          Sbcod: 'APPDT',
        });

        const sMaximubCount = mListData[0].Zchar1;

        oViewModel.setProperty(
          '/InfoMessage',
          `<p>${this.getBundleText('MSG_14002', sMaximubCount)}</p>
          <p>${this.getBundleText('MSG_14003')}</p>`
        );

        oViewModel.setProperty('/FormData/CountMessage', this.getBundleText('MSG_14005', sMaximubCount));

        if (sViewKey === 'N' || !sViewKey) {
          const mSessionData = this.getSessionData();
          const mAppointeeData = this.getAppointeeData();

          oViewModel.setProperty('/FormData/Coaid', '');
          oViewModel.setProperty('/FormData/Zclub', 'ALL');
          oViewModel.setProperty('/FormData/Pernr', mAppointeeData.Pernr);
          oViewModel.setProperty('/FormData/Ename', mAppointeeData.Ename);

          oViewModel.setProperty('/ApplyInfo', {
            Apename: mSessionData.Ename,
            Aporgtx: `${mSessionData.Btrtx} / ${mSessionData.Orgtx}`,
            Apjikgbtl: `${mSessionData.Zzjikgbt} / ${mSessionData.Zzjikcht}`,
          });
        } else {
          const aFilter = [new Filter('Prcty', FilterOperator.EQ, 'D')];

          if (this.isHass()) {
            const sPernr = this.getAppointeeProperty('Pernr');

            aFilter.push(new Filter('Pernr', FilterOperator.EQ, sPernr));
          }

          const oListView = oView.getParent().getPage(this.isHass() ? this.LIST_PAGE_ID.H : this.LIST_PAGE_ID.E);

          if (!!oListView && !!oListView.getModel().getProperty('/parameters')) {
            const mListData = oListView.getModel().getProperty('/parameters');

            if (sViewKey === '00000000000000') {
              aFilter.push(
                // prettier 방지주석
                new Filter('Pernr', FilterOperator.EQ, mListData.Pernr),
                new Filter('Begda', FilterOperator.EQ, mListData.Begda),
                new Filter('Endda', FilterOperator.EQ, mListData.Endda),
                new Filter('Zclub', FilterOperator.EQ, mListData.Zclub)
              );
            } else {
              aFilter.push(new Filter('Appno', FilterOperator.EQ, sViewKey));
            }
          } else {
            aFilter.push(new Filter('Appno', FilterOperator.EQ, sViewKey));
          }

          oModel.read('/ClubJoinApplSet', {
            filters: aFilter,
            success: (oData) => {
              if (oData) {
                const oTargetData = oData.results[0];

                oViewModel.setProperty('/FormData', oTargetData);
                oViewModel.setProperty('/ApplyInfo', oTargetData);
              }
            },
            error: (oError) => {
              AppUtils.handleError(new ODataReadError(oError));
            },
          });
        }
      },

      // 화면관련 List호출
      getList() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const aFilters = [new Filter('Datum', FilterOperator.EQ, new Date())];

        if (this.isHass()) {
          const sPernr = this.getAppointeeProperty('Pernr');

          aFilters.push(new Filter('Pernr', FilterOperator.EQ, sPernr));
        }

        return new Promise((resolve, reject) => {
          // 동호회
          oModel.read('/ClubJoinClublistSet', {
            filters: aFilters,
            success: (oData) => {
              if (oData) {
                resolve(oData.results);
              }
            },
            error: (oError) => {
              reject(new ODataReadError(oError));
            },
          });
        });
      },

      // 동호회 선택시
      onClubType(oEvent) {
        const oViewModel = this.getViewModel();
        const sKey = oEvent.getSource().getSelectedKey();

        if (sKey === 'ALL' || !sKey) return;

        oViewModel.getProperty('/ClubType').forEach((e) => {
          if (e.Zclub === sKey) {
            // oViewModel.setProperty('/FormData', e);
            oViewModel.setProperty('/FormData/Zclubtx', e.Zclubtx);
            oViewModel.setProperty('/FormData/Begda', e.Begda);
            oViewModel.setProperty('/FormData/Endda', e.Endda);
            oViewModel.setProperty('/FormData/Period', e.Period);
            oViewModel.setProperty('/FormData/Mcnt', e.Mcnt);
            oViewModel.setProperty('/FormData/PerHead', e.PerHead);
            oViewModel.setProperty('/FormData/Headnm', e.Headnm);
            oViewModel.setProperty('/FormData/PerLead', e.PerLead);
            oViewModel.setProperty('/FormData/Leadnm', e.Leadnm);
            oViewModel.setProperty('/FormData/Betrg', e.Betrg);
            oViewModel.setProperty('/FormData/Zinfo', e.Zinfo);
            oViewModel.setProperty('/FormData/Memberyn', e.Memberyn);
          }
        });
      },

      // 회사지원체크
      async onSelected(oEvent) {
        const oViewModel = this.getViewModel();
        const oEventSource = oEvent.getSource();
        const bSelected = oEventSource.getSelected();

        if (bSelected) {
          try {
            const oModel = this.getModel(ServiceNames.BENEFIT);
            const mPayLoad = { Prcty: '1' };

            if (this.isHass()) {
              const sPernr = this.getAppointeeProperty('Pernr');

              mPayLoad.Pernr = sPernr;
            }

            await Client.getEntitySet(oModel, 'ClubJoinAppl', mPayLoad);

            oViewModel.setProperty('/FormData/Coaid', 'X');
          } catch (oError) {
            AppUtils.handleError(oError);
            oViewModel.setProperty('/FormData/Coaid', '');
            oEventSource.setSelected(false);
          }
        } else {
          oViewModel.setProperty('/FormData/Coaid', '');
        }
      },

      checkError() {
        const oViewModel = this.getViewModel();
        const oFormData = oViewModel.getProperty('/FormData');

        // 동호회
        if (oFormData.Zclub === 'ALL' || !oFormData.Zclub) {
          MessageBox.alert(this.getBundleText('MSG_14004'));
          return true;
        }

        return false;
      },

      // 재작성
      onRewriteBtn() {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/FormData/Appno', '');
        oViewModel.setProperty('/FormData/Lnsta', '');
      },

      // 임시저장
      onSaveBtn() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oViewModel = this.getViewModel();
        const sAppno = oViewModel.getProperty('/FormData/Appno');
        const oFormData = oViewModel.getProperty('/FormData');

        if (this.checkError()) return;

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00103'), {
          actions: [this.getBundleText('LABEL_00103'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00103')) {
              try {
                AppUtils.setAppBusy(true);

                if (!sAppno) {
                  const sAppno = await Appno.get.call(this);

                  oViewModel.setProperty('/FormData/Appno', sAppno);
                  oViewModel.setProperty('/FormData/Appda', new Date());
                }

                let oSendObject = {};

                oSendObject = oFormData;
                oSendObject.Prcty = 'T';
                oSendObject.Menid = oViewModel.getProperty('/menid');
                oSendObject.Waers = 'KRW';

                await new Promise((resolve, reject) => {
                  oModel.create('/ClubJoinApplSet', oSendObject, {
                    success: () => {
                      resolve();
                    },
                    error: (oError) => {
                      reject(new ODataCreateError({ oError }));
                    },
                  });
                });

                MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00103'));
              } catch (oError) {
                AppUtils.handleError(oError);
              } finally {
                AppUtils.setAppBusy(false);
              }
            }
          },
        });
      },

      // 신청
      onApplyBtn() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oViewModel = this.getViewModel();
        const sAppno = oViewModel.getProperty('/FormData/Appno');
        const oFormData = oViewModel.getProperty('/FormData');

        if (this.checkError()) return;

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00121'), {
          actions: [this.getBundleText('LABEL_00121'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00121')) {
              try {
                AppUtils.setAppBusy(true);

                if (!sAppno) {
                  const sAppno = await Appno.get.call(this);

                  oViewModel.setProperty('/FormData/Appno', sAppno);
                  oViewModel.setProperty('/FormData/Appda', new Date());
                }

                let oSendObject = {};

                oSendObject = oFormData;
                oSendObject.Prcty = 'C';
                oSendObject.Menid = oViewModel.getProperty('/menid');
                oSendObject.Waers = 'KRW';

                await new Promise((resolve, reject) => {
                  oModel.create('/ClubJoinApplSet', oSendObject, {
                    success: () => {
                      resolve();
                    },
                    error: (oError) => {
                      reject(new ODataCreateError({ oError }));
                    },
                  });
                });

                MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00121'), {
                  onClose: () => {
                    this.onNavBack();
                  },
                });
              } catch (oError) {
                AppUtils.handleError(oError);
              } finally {
                AppUtils.setAppBusy(false);
              }
            }
          },
        });
      },

      // 취소
      onCancelBtn() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oViewModel = this.getViewModel();

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00118'), {
          actions: [this.getBundleText('LABEL_00114'), this.getBundleText('LABEL_00118')],
          onClose: (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00114')) {
              AppUtils.setAppBusy(true);

              let oSendObject = {};

              // oSendObject = oViewModel.getProperty('/FormData');
              oSendObject.Prcty = 'W';
              oSendObject.Appno = oViewModel.getProperty('/FormData/Appno');
              oSendObject.Menid = oViewModel.getProperty('/menid');

              oModel.create('/ClubJoinApplSet', oSendObject, {
                success: () => {
                  AppUtils.setAppBusy(false);
                  MessageBox.alert(this.getBundleText('MSG_00039', 'LABEL_00121'), {
                    onClose: () => {
                      this.onNavBack();
                    },
                  });
                },
                error: (oError) => {
                  AppUtils.handleError(new ODataCreateError({ oError }));
                  AppUtils.setAppBusy(false);
                },
              });
            }
          },
        });
      },

      // 삭제
      onDeleteBtn() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oViewModel = this.getViewModel();

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00110'), {
          actions: [this.getBundleText('LABEL_00110'), this.getBundleText('LABEL_00118')],
          onClose: (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00110')) {
              AppUtils.setAppBusy(true);

              const sPath = oModel.createKey('/ClubJoinApplSet', {
                Appno: oViewModel.getProperty('/FormData/Appno'),
              });

              oModel.remove(sPath, {
                success: () => {
                  AppUtils.setAppBusy(false);
                  MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00110'), {
                    onClose: () => {
                      this.onNavBack();
                    },
                  });
                },
                error: (oError) => {
                  AppUtils.handleError(new ODataDeleteError(oError));
                  AppUtils.setAppBusy(false);
                },
              });
            }
          },
        });
      },
    });
  }
);
