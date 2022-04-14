sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/FileAttachmentBoxHandler',
    'sap/ui/yesco/common/FragmentEvent',
    'sap/ui/yesco/common/TextUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Date', // DatePicker 에러 방지 import : Loading of data failed: Error: Date must be a JavaScript date object
  ],
  (
    // prettier 방지용 주석
    Fragment,
    Appno,
    AppUtils,
    ComboEntry,
    FileAttachmentBoxHandler,
    FragmentEvent,
    TextUtils,
    Client,
    ServiceNames,
    MessageBox,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.congratulation.CongDetail', {
      FileAttachmentBoxHandler: null,
      FragmentEvent: FragmentEvent,
      TextUtils: TextUtils,

      initializeModel() {
        return {
          BirthMaxDate: moment().toDate(),
          previousName: '',
          FormData: {},
          benefitDate: '',
          Settings: {},
          BenefitType: [],
          BenefitCause: [],
          BenefitRelation: [],
          busy: false,
        };
      },

      getCurrentLocationText(oArguments) {
        const sAction = oArguments.oDataKey === 'N' ? this.getBundleText('LABEL_04002') : this.getBundleText('LABEL_00165');

        return sAction;
      },

      getPreviousRouteName() {
        return this.getViewModel().getProperty('/previousName');
      },

      // override AttachFileCode
      getApprovalType() {
        return 'HR01';
      },

      async onObjectMatched(oParameter, sRouteName) {
        const sDataKey = oParameter.oDataKey;
        const oViewModel = this.getViewModel();

        oViewModel.setData(this.initializeModel());
        oViewModel.setProperty('/busy', true);

        try {
          // Input Field Imited
          oViewModel.setProperty('/FieldLimit', _.assignIn(this.getEntityLimit(ServiceNames.BENEFIT, 'ConExpenseAppl')));
          oViewModel.setProperty('/previousName', _.chain(sRouteName).split('-', 1).head().value());

          const oModel = this.getModel(ServiceNames.BENEFIT);
          const mAppointeeData = this.getAppointeeData();
          const mPayLoad = {
            Cdnum: 'BE0001',
            Werks: mAppointeeData.Persa || mAppointeeData.Werks,
            Datum: new Date(),
          };

          const aTypeCode = await Client.getEntitySet(oModel, 'BenefitCodeList', mPayLoad);

          oViewModel.setProperty('/BenefitType', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: aTypeCode }));
          oViewModel.setProperty('/BenefitCause', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext' }));
          oViewModel.setProperty('/BenefitRelation', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext' }));

          if (!sDataKey || sDataKey === 'N') {
            const mSessionData = this.getSessionData();

            oViewModel.setProperty('/FormData', mSessionData);
            oViewModel.setProperty('/FormData', {
              Apename: mSessionData.Ename,
              Appernr: mSessionData.Pernr,
              Ename: mAppointeeData.Ename,
              Pernr: mAppointeeData.Pernr,
              Concode: 'ALL',
              Conresn: 'ALL',
              Kdsvh: 'ALL',
            });

            oViewModel.setProperty('/ApplyInfo', {
              Apename: mSessionData.Ename,
              Aporgtx: `${mSessionData.Btrtx} / ${mSessionData.Orgtx}`,
              Apjikgbtl: `${mSessionData.Zzjikgbt} / ${mSessionData.Zzjikcht}`,
            });
          } else {
            const oModel = this.getModel(ServiceNames.BENEFIT);
            const [oTargetData] = await Client.getEntitySet(oModel, 'ConExpenseAppl', {
              Prcty: 'D',
              Menid: this.getCurrentMenuId(),
              Appno: sDataKey,
              Pernr: mAppointeeData.Pernr,
            });

            oViewModel.setProperty('/FormData', oTargetData);
            oViewModel.setProperty('/ApplyInfo', oTargetData);
            oViewModel.setProperty('/ApprovalDetails', oTargetData);

            this.getBenefitData();
          }

          this.settingsAttachTable();
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      formatFlowerTxt(vFlower) {
        return vFlower === undefined ? '' : vFlower === 'X' ? 'Y' : 'N';
      },

      // 전체list에 맞는코드 조회
      async getBenefitData() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oViewModel = this.getViewModel();
        const mFormData = oViewModel.getProperty('/FormData');
        const mAppointeeData = this.getAppointeeData();
        const sUrl = 'BenefitCodeList';

        try {
          oViewModel.setProperty('/busy', true);

          const mPayLoad1 = {
            Cdnum: 'BE0002',
            Werks: mAppointeeData.Persa || mAppointeeData.Werks,
            Datum: new Date(),
            Upcod: mFormData.Concode,
            Upcod2: 'E',
            Pernr: mAppointeeData.Pernr,
          };
          const aCause = await Client.getEntitySet(oModel, sUrl, mPayLoad1);

          oViewModel.setProperty('/BenefitCause', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: aCause }));

          const mPayLoad2 = {
            Cdnum: 'BE0003',
            Werks: mAppointeeData.Persa || mAppointeeData.Werks,
            Datum: new Date(),
            Upcod: mFormData.Concode,
            Upcod2: mFormData.Conresn,
          };
          const aRelation = await Client.getEntitySet(oModel, sUrl, mPayLoad2);

          const oRelationBtn = this.byId('RelationBtn');
          const oRelationTxt = this.byId('RelationTxt');
          const oBirthDatePicker = this.byId('BirthDatePicker');

          oViewModel.setProperty('/BenefitRelation', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: aRelation }));
          oViewModel.setProperty('/TargetList', []);

          if (!mFormData.ZappStatAl || mFormData.ZappStatAl === '10') {
            if (!!aRelation[0] && aRelation[0].Zcode === 'ME') {
              this.onTargetDialog();
              oRelationBtn.setVisible(false);
              oRelationTxt.setEditable(false);
              oBirthDatePicker.setEditable(false);
            } else {
              oRelationBtn.setVisible(true);
              oRelationTxt.setEditable(true);
              oBirthDatePicker.setEditable(true);
            }
          }
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // 경조유형 선택시
      async onTypeChange(oEvent) {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          let sSelectText = oEvent.getSource().getSelectedItem().getText();

          oViewModel.setProperty('/FormData/Context', sSelectText);

          const oModel = this.getModel(ServiceNames.BENEFIT);
          const sSelectKey = oEvent.getSource().getSelectedKey();
          const mAppointeeData = this.getAppointeeData();
          const mPayLoad = {
            Cdnum: 'BE0002',
            Werks: mAppointeeData.Persa || mAppointeeData.Werks,
            Datum: new Date(),
            Upcod: sSelectKey,
            Upcod2: 'E',
            Pernr: mAppointeeData.Pernr,
          };
          const aRelation = await Client.getEntitySet(oModel, 'BenefitCodeList', mPayLoad);

          oViewModel.setProperty('/BenefitCause', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: aRelation }));
          oViewModel.setProperty('/BenefitRelation', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext' }));
          oViewModel.setProperty('/FormData/Conresn', 'ALL');
          oViewModel.setProperty('/FormData/Kdsvh', 'ALL');

          const oRelationBtn = this.byId('RelationBtn');
          const oRelationTxt = this.byId('RelationTxt');
          const oBirthDatePicker = this.byId('BirthDatePicker');

          oRelationBtn.setVisible(true);
          oRelationTxt.setEditable(true);
          oBirthDatePicker.setEditable(true);
          oViewModel.setProperty('/TargetList', []);
          oViewModel.setProperty('/FormData/Zname', '');
          oViewModel.setProperty('/FormData/Zbirthday', null);
          oViewModel.setProperty('/FormData/Conddate', null);
          this.getNomalPay();
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // 경조사유 선택시
      async onCauseChange(oEvent) {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oViewModel = this.getViewModel();
        const mFormData = oViewModel.getProperty('/FormData');
        const sSelectKey = oEvent.getSource().getSelectedKey();
        const sSelectText = oEvent.getSource().getSelectedItem().getText();
        const mAppointeeData = this.getAppointeeData();

        try {
          oViewModel.setProperty('/busy', true);
          oViewModel.setProperty('/FormData/Conretx', sSelectText);
          oViewModel.setProperty(
            '/benefitDate',
            _.find(oViewModel.getProperty('/BenefitCause'), (e) => {
              return sSelectKey === e.Zcode;
            }).Zchar1
          );
          this.getNomalPay(this);

          const mPayLoad = {
            Cdnum: 'BE0003',
            Werks: mAppointeeData.Persa || mAppointeeData.Werks,
            Datum: new Date(),
            Upcod: mFormData.Concode,
            Upcod2: sSelectKey,
          };
          const aList = await Client.getEntitySet(oModel, 'BenefitCodeList', mPayLoad);
          const oRelationBtn = this.byId('RelationBtn');
          const oRelationTxt = this.byId('RelationTxt');
          const oBirthDatePicker = this.byId('BirthDatePicker');

          oViewModel.setProperty('/TargetList', []);
          oViewModel.setProperty('/FormData/Zname', '');
          oViewModel.setProperty('/FormData/Zbirthday', null);
          oViewModel.setProperty('/FormData/Conddate', null);

          if (!oViewModel.getProperty('/FormData/ZappStatAl') || oViewModel.getProperty('/FormData/ZappStatAl') === '10') {
            if (!!aList[0] && aList[0].Zcode === 'ME') {
              oViewModel.setProperty('/BenefitRelation', aList);
              this.onTargetDialog();
              oRelationBtn.setVisible(false);
              oRelationTxt.setEditable(false);
              oBirthDatePicker.setEditable(false);
            } else {
              oViewModel.setProperty('/BenefitRelation', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: aList }));
              oViewModel.setProperty('/FormData/Kdsvh', 'ALL');
              oRelationBtn.setVisible(true);
              oRelationTxt.setEditable(true);
              oBirthDatePicker.setEditable(true);
            }
          }
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // 대상자 생년월일
      onBirthDate(oEvent) {
        const oViewModel = this.getViewModel();
        const sAddDate = oViewModel.getProperty('/benefitDate');

        if (!!sAddDate) {
          const dDate = moment(oEvent.getSource().getDateValue()).add('year', sAddDate).toDate();

          oViewModel.setProperty('/FormData/Conddate', dDate);
          oViewModel.setProperty('/FormData/Conrdate', dDate);
          this.getNomalPay();
        }
      },

      // 대상자 관계선택시
      onRelationChange(oEvent) {
        const oViewModel = this.getViewModel();
        const sSelectKey = oEvent.getSource().getSelectedKey();
        const oRelationBtn = this.byId('RelationBtn');
        const oRelationTxt = this.byId('RelationTxt');
        const oBirthDatePicker = this.byId('BirthDatePicker');

        oViewModel.setProperty('/FormData/Kdsvh', sSelectKey);

        if (!!sSelectKey && sSelectKey === 'ME') {
          this.onTargetDialog();
          oRelationBtn.setVisible(false);
          oRelationTxt.setEditable(false);
          oBirthDatePicker.setEditable(false);
        } else {
          oViewModel.setProperty('/FormData/Zbirthday', null);
          oViewModel.setProperty('/FormData/Conddate', null);
          oViewModel.setProperty('/FormData/Zname', '');
          oRelationBtn.setVisible(true);
          oRelationTxt.setEditable(true);
          oBirthDatePicker.setEditable(true);
        }
      },

      // 증빙상 경조일 선택시
      onBenefitChangeDate(oEvent) {
        this.getViewModel().setProperty('/FormData/Conrdate', oEvent.getSource().getDateValue());
        this.getNomalPay();
      },

      // 기본급, 지급율 등 받아옴
      async getNomalPay() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oViewModel = this.getViewModel();
        const vConcode = oViewModel.getProperty('/FormData/Concode');
        const vConresn = oViewModel.getProperty('/FormData/Conresn');
        const vConddate = oViewModel.getProperty('/FormData/Conddate');

        if (!vConcode || !vConresn || !vConddate) return;

        try {
          oViewModel.setProperty('/busy', true);

          const mAppointeeData = this.getAppointeeData();
          const [mPay] = await Client.getEntitySet(oModel, 'ConExpenseCheckList', {
            Werks: mAppointeeData.Persa || mAppointeeData.Werks,
            Pernr: this.getAppointeeProperty('Pernr'),
            Concode: vConcode,
            Conresn: vConresn,
            Conddate: vConddate,
          });

          oViewModel.setProperty('/FormData/ZbacBet', mPay.ZbacBet);
          oViewModel.setProperty('/FormData/ZbacBetT', mPay.ZbacBetT);
          oViewModel.setProperty('/FormData/Payrt', mPay.Payrt);
          oViewModel.setProperty('/FormData/PayrtT', mPay.PayrtT);
          oViewModel.setProperty('/FormData/ZpayBetT', mPay.ZpayBetT);
          oViewModel.setProperty('/FormData/ZpayBet', mPay.ZpayBet);
          oViewModel.setProperty('/FormData/Zflower', mPay.Zflower);
          oViewModel.setProperty('/FormData/Zemp', mPay.Zemp);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // 대상자 성명 선택시
      async onTargetDialog() {
        const oViewModel = this.getViewModel();

        // load asynchronous XML fragment
        if (!this.byId('targetSettingsDialog')) {
          Fragment.load({
            id: this.getView().getId(),
            name: 'sap.ui.yesco.mvc.view.congratulation.fragment.TargetDialog',
            controller: this,
          }).then(async (oDialog) => {
            // connect dialog to the root view of this component (models, lifecycle)
            this.getView().addDependent(oDialog);
            const oTargetList = await this.getTargetList();
            const mFormData = oViewModel.getProperty('/FormData');
            const oChildList = [];

            oTargetList.forEach((e) => {
              if (oTargetList.length !== 0 && (!mFormData.Kdsvh || mFormData.Kdsvh === e.Kdsvh)) {
                oChildList.push(e);
              }
            });

            if (oChildList.length === 1) {
              oViewModel.setProperty('/FormData/Zbirthday', oChildList[0].Zbirthday);
              oViewModel.setProperty('/FormData/Kdsvh', oChildList[0].Kdsvh);
              oViewModel.setProperty('/FormData/Zname', oChildList[0].Zname);

              const sAddDate = oViewModel.getProperty('/benefitDate');

              if (!!sAddDate) {
                const dDate = moment(oChildList[0].Zbirthday).add('year', sAddDate).toDate();

                oViewModel.setProperty('/FormData/Conddate', dDate);
                oViewModel.setProperty('/FormData/Conrdate', dDate);
                this.getNomalPay();
              }
            }

            oViewModel.setProperty('/TargetList', oChildList);
            this.byId('targetTable').setVisibleRowCount(oChildList.length);

            if (oChildList.length === 1 || oViewModel.getProperty('/FormData/Kdsvh') === 'ME') return;

            if (oChildList.length === 0) {
              return MessageBox.alert(this.getBundleText('MSG_03006'));
            }

            oDialog.open();
          });
        } else {
          const oTargetList = await this.getTargetList();
          const mFormData = oViewModel.getProperty('/FormData');
          const oChildList = [];

          oTargetList.forEach((e) => {
            if (oTargetList.length !== 0 && (!mFormData.Kdsvh || mFormData.Kdsvh === e.Kdsvh)) {
              oChildList.push(e);
            }
          });

          if (oChildList.length === 1) {
            oViewModel.setProperty('/FormData/Zbirthday', oChildList[0].Zbirthday);
            oViewModel.setProperty('/FormData/Kdsvh', oChildList[0].Kdsvh);
            oViewModel.setProperty('/FormData/Zname', oChildList[0].Zname);

            const sAddDate = oViewModel.getProperty('/benefitDate');

            if (!!sAddDate) {
              const dDate = moment(oChildList[0].Zbirthday).add('year', sAddDate).toDate();

              oViewModel.setProperty('/FormData/Conddate', dDate);
              oViewModel.setProperty('/FormData/Conrdate', dDate);
              this.getNomalPay();
            }
          }

          oViewModel.setProperty('/TargetList', oChildList);
          this.byId('targetTable').setVisibleRowCount(oChildList.length);

          if (oChildList.length === 1 || oViewModel.getProperty('/FormData/Kdsvh') === 'ME') return;

          if (oChildList.length === 0) {
            return MessageBox.alert(this.getBundleText('MSG_03006'));
          }

          this.byId('targetSettingsDialog').open();
        }
      },

      // 대상자 리스트 조회
      async getTargetList() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oViewModel = this.getViewModel();
        const mFormData = oViewModel.getProperty('/FormData');
        const mAppointeeData = this.getAppointeeData();
        const mPayLoad = {
          Werks: mAppointeeData.Persa || mAppointeeData.Werks,
          Concode: mFormData.Concode,
          Conresn: mFormData.Conresn,
          Datum: new Date(),
          Pernr: mAppointeeData.Pernr,
        };

        return await Client.getEntitySet(oModel, 'ConExpenseSupportList', mPayLoad);
      },

      // Dialog 대상자 클릭
      TargetClick(oEvent) {
        const vPath = oEvent.getParameter('rowBindingContext').getPath();
        const oViewModel = this.getViewModel();
        const mRowData = oViewModel.getProperty(vPath);

        oViewModel.setProperty('/FormData/Zbirthday', mRowData.Zbirthday);
        oViewModel.setProperty('/FormData/Kdsvh', mRowData.Kdsvh);
        oViewModel.setProperty('/FormData/Zname', mRowData.Zname);

        const sAddDate = oViewModel.getProperty('/benefitDate');

        if (!!sAddDate) {
          const dDate = moment(mRowData.Zbirthday).add('year', sAddDate).toDate();

          oViewModel.setProperty('/FormData/Conddate', dDate);
          oViewModel.setProperty('/FormData/Conrdate', dDate);
          this.getNomalPay();
        }
        this.byId('targetSettingsDialog').close();
      },

      //  대상자 성명 Dialog 닫기클릭
      onClick() {
        this.byId('targetSettingsDialog').close();
      },

      checkError() {
        const oViewModel = this.getViewModel();
        const mFormData = oViewModel.getProperty('/FormData');

        // 경조유형
        if (mFormData.Concode === 'ALL' || !mFormData.Concode) {
          MessageBox.alert(this.getBundleText('MSG_02010'));
          return true;
        }

        // 경조사유
        if (mFormData.Conresn === 'ALL' || !mFormData.Conresn) {
          MessageBox.alert(this.getBundleText('MSG_02011'));
          return true;
        }

        // 대상자 관계
        if (mFormData.Kdsvh === 'ALL' || !mFormData.Kdsvh) {
          MessageBox.alert(this.getBundleText('MSG_02012'));
          return true;
        }

        // 대상자 생년월일
        if (!mFormData.Zbirthday) {
          MessageBox.alert(this.getBundleText('MSG_02006'));
          return true;
        }

        // 경조일
        if (!mFormData.Conddate) {
          MessageBox.alert(this.getBundleText('MSG_02007'));
          return true;
        }

        // 대상자 성명
        if (!mFormData.Zname) {
          MessageBox.alert(this.getBundleText('MSG_02008'));
          return true;
        }

        // 행사장소
        if (!mFormData.Zeloc) {
          MessageBox.alert(this.getBundleText('MSG_02009'));
          return true;
        }

        return false;
      },

      // 재작성
      onRewriteBtn() {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/FormData/Appno', '');
        oViewModel.setProperty('/FormData/ZappStatAl', '');
        this.settingsAttachTable();
      },

      // 임시저장
      onSaveBtn() {
        if (this.checkError()) {
          return;
        }

        const sMessage = this.getBundleText('MSG_00006', 'LABEL_00103'); // {저장}하시겠습니까?
        const sYes = this.getBundleText('LABEL_00103'); // 저장

        MessageBox.confirm(sMessage, {
          actions: [
            sYes,
            this.getBundleText('LABEL_00118'), // 취소
          ],
          onClose: async (sAction) => {
            if (sAction !== sYes) {
              return;
            }

            const oViewModel = this.getViewModel();

            try {
              AppUtils.setAppBusy(true);

              const mFormData = oViewModel.getProperty('/FormData');
              const sAppno = mFormData.Appno;

              if (!sAppno) {
                const sAppno = await Appno.get();

                oViewModel.setProperty('/FormData/Appno', sAppno);
                oViewModel.setProperty('/FormData/ZappStatAl', '10');
                oViewModel.setProperty('/FormData/Appdt', new Date());
              }

              // 파일 삭제 및 업로드
              const oError = await this.FileAttachmentBoxHandler.upload(mFormData.Appno);
              if (oError && oError.code === 'E') {
                throw oError;
              }

              const oModel = this.getModel(ServiceNames.BENEFIT);
              const mSendObject = {
                ...mFormData,
                Prcty: 'T',
                Menid: this.getCurrentMenuId(),
                Waers: 'KRW',
              };

              await Client.create(oModel, 'ConExpenseAppl', mSendObject);
              MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00103')); // {저장}되었습니다.
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
        if (this.checkError()) {
          return;
        }

        const sMessage = this.getBundleText('MSG_00006', 'LABEL_00121'); // {신청}하시겠습니까?
        const sYes = this.getBundleText('LABEL_00121'); // 신청

        MessageBox.confirm(sMessage, {
          actions: [
            sYes,
            this.getBundleText('LABEL_00118'), // 취소
          ],
          onClose: async (sAction) => {
            if (sAction !== sYes) {
              return;
            }

            const oViewModel = this.getViewModel();

            try {
              AppUtils.setAppBusy(true);

              const mFormData = oViewModel.getProperty('/FormData');
              const sAppno = mFormData.Appno;

              if (!sAppno) {
                const sAppno = await Appno.get();

                oViewModel.setProperty('/FormData/Appno', sAppno);
                oViewModel.setProperty('/FormData/Appdt', new Date());
              }

              // 파일 삭제 및 업로드
              await this.FileAttachmentBoxHandler.upload(mFormData.Appno);

              const oModel = this.getModel(ServiceNames.BENEFIT);
              const mSendObject = {
                ...mFormData,
                Prcty: 'C',
                Menid: this.getCurrentMenuId(),
                Waers: 'KRW',
              };

              await Client.create(oModel, 'ConExpenseAppl', mSendObject);
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
        const oViewModel = this.getViewModel();

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00118'), {
          actions: [this.getBundleText('LABEL_00114'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00114')) {
              AppUtils.setAppBusy(true);

              try {
                const oModel = this.getModel(ServiceNames.BENEFIT);
                const mSendObject = {
                  ...oViewModel.getProperty('/FormData'),
                  Prcty: 'W',
                  Menid: this.getCurrentMenuId(),
                };

                await Client.create(oModel, 'ConExpenseAppl', mSendObject);
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
            }
          },
        });
      },

      // 삭제
      onDeleteBtn() {
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00110'), {
          actions: [this.getBundleText('LABEL_00110'), this.getBundleText('LABEL_00118')],
          onClose: async (sAction) => {
            if (!sAction || sAction !== this.getBundleText('LABEL_00110')) {
              return;
            }

            AppUtils.setAppBusy(true);

            try {
              const oModel = this.getModel(ServiceNames.BENEFIT);
              const oViewModel = this.getViewModel();

              await Client.remove(oModel, 'ConExpenseAppl', { Appno: oViewModel.getProperty('/FormData/Appno') });

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

      // AttachFileTable Settings
      settingsAttachTable() {
        const oViewModel = this.getViewModel();
        const sStatus = oViewModel.getProperty('/FormData/ZappStatAl');
        const sAppno = oViewModel.getProperty('/FormData/Appno') || '';

        this.FileAttachmentBoxHandler = new FileAttachmentBoxHandler(this, {
          editable: !sStatus || sStatus === '10',
          appno: sAppno,
          apptp: this.getApprovalType(),
          maxFileCount: 10,
          fileTypes: ['ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'txt', 'bmp', 'gif', 'png', 'pdf'],
        });
      },
    });
  }
);
