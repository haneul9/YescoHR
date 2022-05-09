/* eslint-disable no-useless-call */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/exceptions/UI5Error',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    MessageBox,
    Appno,
    AppUtils,
    ComboEntry,
    UI5Error,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.clubJoin.ClubJoinDetail', {
      LIST_PAGE_ID: { E: 'container-ehr---clubJoin', H: 'container-ehr---h_clubJoin' },

      initializeModel() {
        return {
          previousName: '',
          FormData: {},
          Settings: {},
          ClubType: [],
          busy: false,
        };
      },

      getPreviousRouteName() {
        return this.getViewModel().getProperty('/previousName');
      },

      async onObjectMatched(oParameter, sRouteName) {
        const sDataKey = oParameter.oDataKey;
        const oViewModel = this.getViewModel();

        oViewModel.setData(this.initializeModel());
        oViewModel.setProperty('/busy', true);

        try {
          // Input Field Imited
          oViewModel.setProperty('/FieldLimit', _.assignIn(this.getEntityLimit(ServiceNames.BENEFIT, 'ClubJoinAppl')));
          oViewModel.setProperty('/previousName', _.chain(sRouteName).split('-', 1).head().value());

          const aList = await this.getList();

          oViewModel.setProperty('/ClubType', new ComboEntry({ codeKey: 'Zclub', valueKey: 'Zclubtx', aEntries: aList }));
          this.setFormData(sDataKey);
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
      async setFormData(sViewKey = '') {
        const oView = this.getView();
        const oViewModel = this.getViewModel();
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const [oCount] = await Client.getEntitySet(oModel, 'BenefitCodeList', {
          Pernr: this.getAppointeeProperty('Pernr'),
          Werks: this.getAppointeeProperty('Werks'),
          Cdnum: 'BE0018',
          Grcod: 'BE000030',
          Sbcod: 'APPDT',
        });

        const sMaximubCount = oCount.Zchar1;

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
          const oListView = oView.getParent().getPage(this.isHass() ? this.LIST_PAGE_ID.H : this.LIST_PAGE_ID.E);
          let mPayLoad = {
            Prcty: 'D',
            Pernr: this.getAppointeeProperty('Pernr'),
          };

          if (!!oListView && !!oListView.getModel().getProperty('/parameters')) {
            const mListData = oListView.getModel().getProperty('/parameters');

            if (sViewKey === '00000000000000') {
              mPayLoad = {
                // prettier 방지주석
                ...mPayLoad,
                Pernr: _.get(mListData, 'Pernr'),
                Begda: _.get(mListData, 'Begda'),
                Endda: _.get(mListData, 'Endda'),
                Zclub: _.get(mListData, 'Zclub'),
              };
            } else {
              mPayLoad = {
                ...mPayLoad,
                Appno: sViewKey,
              };
            }
          } else {
            // 잘못된 접근입니다.
            MessageBox.alert(this.getBundleText('MSG_00043'), {
              onClose: () => {
                this.getRouter().navTo(oViewModel.getProperty('/previousName'));
              },
            });
          }

          const [oTargetData] = await Client.getEntitySet(oModel, 'ClubJoinAppl', mPayLoad);

          oViewModel.setProperty('/FormData', oTargetData);
          oViewModel.setProperty('/ApplyInfo', oTargetData);
        }
      },

      // 화면관련 List호출
      getList() {
        const oModel = this.getModel(ServiceNames.BENEFIT);

        return Client.getEntitySet(oModel, 'ClubJoinClublist', {
          Datum: new Date(),
          Pernr: this.getAppointeeProperty('Pernr'),
        });
      },

      // 동호회 선택시
      onClubType(oEvent) {
        const oViewModel = this.getViewModel();
        const sKey = oEvent.getSource().getSelectedKey();

        if (sKey === 'ALL' || !sKey) return;

        oViewModel.getProperty('/ClubType').forEach((e) => {
          if (e.Zclub === sKey) {
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
            const mPayLoad = {
              Prcty: '1',
              Pernr: this.getAppointeeProperty('Pernr'),
            };

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
        const mFormData = oViewModel.getProperty('/FormData');

        // 동호회
        if (mFormData.Zclub === 'ALL' || !mFormData.Zclub) {
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
        if (this.checkError()) return;

        // {저장}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00103'), {
          // 저장, 취소
          actions: [this.getBundleText('LABEL_00103'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            // 저장
            if (!vPress || vPress !== this.getBundleText('LABEL_00103')) {
              return;
            }

            AppUtils.setAppBusy(true);

            try {
              const oViewModel = this.getViewModel();
              const mFormData = oViewModel.getProperty('/FormData');

              if (!mFormData.Appno) {
                const sAppno = await Appno.get.call(this);

                _.chain(oViewModel.getProperty('/FormData')).set('Appno', sAppno).set('Appda', new Date()).commit();
              }

              const oModel = this.getModel(ServiceNames.BENEFIT);
              let mSendObject = {
                ...mFormData,
                Prcty: 'T',
                Menid: this.getCurrentMenuId(),
                Waers: 'KRW',
              };

              await Client.create(oModel, 'ClubJoinAppl', mSendObject);

              // {저장}되었습니다.
              MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00103'));
            } catch (oError) {
              AppUtils.handleError(oError);
            } finally {
              AppUtils.setAppBusy(false);
            }
          },
        });
      },

      // 신청
      onApplyBtn() {
        if (this.checkError()) return;

        // {신청}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00121'), {
          // 신청, 취소
          actions: [this.getBundleText('LABEL_00121'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            // 신청
            if (!vPress || vPress !== this.getBundleText('LABEL_00121')) {
              return;
            }

            AppUtils.setAppBusy(true);

            try {
              const oViewModel = this.getViewModel();
              const mFormData = oViewModel.getProperty('/FormData');

              if (!mFormData.Appno) {
                const sAppno = await Appno.get.call(this);

                _.chain(oViewModel.getProperty('/FormData')).set('Appno', sAppno).set('Appda', new Date()).commit();
              }

              const oModel = this.getModel(ServiceNames.BENEFIT);
              let mSendObject = {
                ...mFormData,
                Prcty: 'C',
                Menid: this.getCurrentMenuId(),
                Waers: 'KRW',
              };

              await Client.create(oModel, 'ClubJoinAppl', mSendObject);

              // {신청}되었습니다.
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
          },
        });
      },

      // 취소
      onCancelBtn() {
        // {취소}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00118'), {
          // 확인, 취소
          actions: [this.getBundleText('LABEL_00114'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            // 취소
            if (!vPress || vPress !== this.getBundleText('LABEL_00114')) {
              return;
            }

            AppUtils.setAppBusy(true);
            try {
              const oModel = this.getModel(ServiceNames.BENEFIT);
              const oViewModel = this.getViewModel();

              let mSendObject = {
                Prcty: 'W',
                Appno: oViewModel.getProperty('/FormData/Appno'),
                Menid: this.getCurrentMenuId(),
              };

              await Client.create(oModel, 'ClubJoinAppl', mSendObject);

              // {취소}되었습니다.
              MessageBox.alert(this.getBundleText('MSG_00039', 'LABEL_00121'), {
                onClose: () => {
                  this.onNavBack();
                },
              });
            } catch (oError) {
              AppUtils.handleError(oError);
            } finally {
              AppUtils.setAppBusy(false);
            }
          },
        });
      },

      // 삭제
      onDeleteBtn() {
        // {삭제}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00110'), {
          // 삭제, 취소
          actions: [this.getBundleText('LABEL_00110'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            // 삭제
            if (!vPress || vPress !== this.getBundleText('LABEL_00110')) {
              return;
            }

            AppUtils.setAppBusy(true);

            try {
              const oModel = this.getModel(ServiceNames.BENEFIT);
              const oViewModel = this.getViewModel();

              await Client.remove(oModel, 'ClubJoinAppl', { Appno: oViewModel.getProperty('/FormData/Appno') });

              // {삭제}되었습니다.
              MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00110'), {
                onClose: () => {
                  this.onNavBack();
                },
              });
            } catch (oError) {
              AppUtils.handleError(oError);
            } finally {
              AppUtils.setAppBusy(false);
            }
          },
        });
      },
    });
  }
);
