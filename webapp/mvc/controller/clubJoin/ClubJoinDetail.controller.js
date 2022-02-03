/* eslint-disable no-useless-call */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/FragmentEvent',
    'sap/ui/yesco/common/TextUtils',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/exceptions/ODataReadError',
    'sap/ui/yesco/common/exceptions/ODataCreateError',
    'sap/ui/yesco/common/exceptions/ODataDeleteError',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Currency',
  ],
  (
    // prettier 방지용 주석
    Filter,
    FilterOperator,
    JSONModel,
    MessageBox,
    Appno,
    AppUtils,
    ComboEntry,
    FragmentEvent,
    TextUtils,
    TableUtils,
    Client,
    ServiceNames,
    ODataReadError,
    ODataCreateError,
    ODataDeleteError,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.clubJoin.ClubJoinDetail', {
      LIST_PAGE_ID: 'container-ehr---clubJoin',

      TextUtils: TextUtils,
      TableUtils: TableUtils,
      FragmentEvent: FragmentEvent,

      onBeforeShow() {
        const oViewModel = new JSONModel({
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
        });
        this.setViewModel(oViewModel);

        this.getViewModel().setProperty('/busy', true);
      },

      async onObjectMatched(oParameter) {
        const sDataKey = oParameter.oDataKey;
        const sMenid = this.getCurrentMenuId();
        const oDetailModel = this.getViewModel();

        oDetailModel.setProperty('/menid', sMenid);
        oDetailModel.setProperty('/ViewKey', sDataKey);

        try {
          const aList = await this.getList();

          oDetailModel.setProperty('/ClubType', new ComboEntry({ codeKey: 'Zclub', valueKey: 'Zclubtx', aEntries: aList }));
          this.setFormData();
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oDetailModel.setProperty('/busy', false);
        }
      },

      getCurrentLocationText(oArguments) {
        const sAction = oArguments.oDataKey === 'N' ? this.getBundleText('LABEL_04002') : this.getBundleText('LABEL_00165');

        return sAction;
      },

      // 상세조회
      async setFormData() {
        const oView = this.getView();
        const oDetailModel = this.getViewModel();
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const sViewKey = oDetailModel.getProperty('/ViewKey');
        const mPernr = this.isHass() ? { Pernr: this.getAppointeeProperty('Pernr') } : {};
        const mListData = await Client.getEntitySet(oModel, 'BenefitCodeList', {
          ...mPernr,
          Werks: this.getAppointeeProperty('Werks'),
          Cdnum: 'BE0018',
          Grcod: 'BE000030',
          Sbcod: 'APPDT',
        });

        const sMaximubCount = mListData[0].Zchar1;

        oDetailModel.setProperty(
          '/InfoMessage',
          `<p>${this.getBundleText('MSG_14002', sMaximubCount)}</p>
          <p>${this.getBundleText('MSG_14003')}</p>`
        );

        oDetailModel.setProperty('/FormData/CountMessage', this.getBundleText('MSG_14005', sMaximubCount));

        if (sViewKey === 'N' || !sViewKey) {
          const mSessionData = this.getSessionData();
          const mAppointeeData = this.getAppointeeData();

          oDetailModel.setProperty('/FormData/Coaid', '');
          oDetailModel.setProperty('/FormData/Zclub', 'ALL');
          oDetailModel.setProperty('/FormData/Pernr', mAppointeeData.Pernr);
          oDetailModel.setProperty('/FormData/Ename', mAppointeeData.Ename);

          oDetailModel.setProperty('/ApplyInfo', {
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

          const oListView = oView.getParent().getPage(this.LIST_PAGE_ID);

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

                oDetailModel.setProperty('/FormData', oTargetData);
                oDetailModel.setProperty('/ApplyInfo', oTargetData);
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
        const oDetailModel = this.getViewModel();
        const sKey = oEvent.getSource().getSelectedKey();

        if (sKey === 'ALL' || !sKey) return;

        oDetailModel.getProperty('/ClubType').forEach((e) => {
          if (e.Zclub === sKey) {
            // oDetailModel.setProperty('/FormData', e);
            oDetailModel.setProperty('/FormData/Zclubtx', e.Zclubtx);
            oDetailModel.setProperty('/FormData/Begda', e.Begda);
            oDetailModel.setProperty('/FormData/Endda', e.Endda);
            oDetailModel.setProperty('/FormData/Period', e.Period);
            oDetailModel.setProperty('/FormData/Mcnt', e.Mcnt);
            oDetailModel.setProperty('/FormData/PerHead', e.PerHead);
            oDetailModel.setProperty('/FormData/Headnm', e.Headnm);
            oDetailModel.setProperty('/FormData/PerLead', e.PerLead);
            oDetailModel.setProperty('/FormData/Leadnm', e.Leadnm);
            oDetailModel.setProperty('/FormData/Betrg', e.Betrg);
            oDetailModel.setProperty('/FormData/Zinfo', e.Zinfo);
            oDetailModel.setProperty('/FormData/Memberyn', e.Memberyn);
          }
        });
      },

      // 회사지원체크
      async onSelected(oEvent) {
        const oDetailModel = this.getViewModel();
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

            oDetailModel.setProperty('/FormData/Coaid', 'X');
          } catch (oError) {
            AppUtils.handleError(oError);
            oDetailModel.setProperty('/FormData/Coaid', '');
            oEventSource.setSelected(false);
          }
        } else {
          oDetailModel.setProperty('/FormData/Coaid', '');
        }
      },

      checkError() {
        const oDetailModel = this.getViewModel();
        const oFormData = oDetailModel.getProperty('/FormData');

        // 동호회
        if (oFormData.Zclub === 'ALL' || !oFormData.Zclub) {
          MessageBox.alert(this.getBundleText('MSG_14004'));
          return true;
        }

        return false;
      },

      // 재작성
      onRewriteBtn() {
        const oDetailModel = this.getViewModel();

        oDetailModel.setProperty('/FormData/Appno', '');
        oDetailModel.setProperty('/FormData/Lnsta', '');
      },

      // 임시저장
      onSaveBtn() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const sAppno = oDetailModel.getProperty('/FormData/Appno');
        const oFormData = oDetailModel.getProperty('/FormData');

        if (this.checkError()) return;

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00103'), {
          actions: [this.getBundleText('LABEL_00103'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00103')) {
              try {
                AppUtils.setAppBusy(true, this);

                if (!sAppno) {
                  const sAppno = await Appno.get.call(this);

                  oDetailModel.setProperty('/FormData/Appno', sAppno);
                  oDetailModel.setProperty('/FormData/Appda', new Date());
                }

                let oSendObject = {};

                oSendObject = oFormData;
                oSendObject.Prcty = 'T';
                oSendObject.Menid = oDetailModel.getProperty('/menid');
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
                AppUtils.setAppBusy(false, this);
              }
            }
          },
        });
      },

      // 신청
      onApplyBtn() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const sAppno = oDetailModel.getProperty('/FormData/Appno');
        const oFormData = oDetailModel.getProperty('/FormData');

        if (this.checkError()) return;

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00121'), {
          actions: [this.getBundleText('LABEL_00121'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00121')) {
              try {
                AppUtils.setAppBusy(true, this);

                if (!sAppno) {
                  const sAppno = await Appno.get.call(this);

                  oDetailModel.setProperty('/FormData/Appno', sAppno);
                  oDetailModel.setProperty('/FormData/Appda', new Date());
                }

                let oSendObject = {};

                oSendObject = oFormData;
                oSendObject.Prcty = 'C';
                oSendObject.Menid = oDetailModel.getProperty('/menid');
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
                AppUtils.setAppBusy(false, this);
              }
            }
          },
        });
      },

      // 취소
      onCancelBtn() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00118'), {
          actions: [this.getBundleText('LABEL_00114'), this.getBundleText('LABEL_00118')],
          onClose: (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00114')) {
              AppUtils.setAppBusy(true, this);

              let oSendObject = {};

              // oSendObject = oDetailModel.getProperty('/FormData');
              oSendObject.Prcty = 'W';
              oSendObject.Appno = oDetailModel.getProperty('/FormData/Appno');
              oSendObject.Menid = oDetailModel.getProperty('/menid');

              oModel.create('/ClubJoinApplSet', oSendObject, {
                success: () => {
                  AppUtils.setAppBusy(false, this);
                  MessageBox.alert(this.getBundleText('MSG_00039', 'LABEL_00121'), {
                    onClose: () => {
                      this.onNavBack();
                    },
                  });
                },
                error: (oError) => {
                  AppUtils.handleError(new ODataCreateError({ oError }));
                  AppUtils.setAppBusy(false, this);
                },
              });
            }
          },
        });
      },

      // 삭제
      onDeleteBtn() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00110'), {
          actions: [this.getBundleText('LABEL_00110'), this.getBundleText('LABEL_00118')],
          onClose: (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00110')) {
              AppUtils.setAppBusy(true, this);

              const sPath = oModel.createKey('/ClubJoinApplSet', {
                Appno: oDetailModel.getProperty('/FormData/Appno'),
              });

              oModel.remove(sPath, {
                success: () => {
                  AppUtils.setAppBusy(false, this);
                  MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00110'), {
                    onClose: () => {
                      this.onNavBack();
                    },
                  });
                },
                error: (oError) => {
                  AppUtils.handleError(new ODataDeleteError(oError));
                  AppUtils.setAppBusy(false, this);
                },
              });
            }
          },
        });
      },
    });
  }
);
