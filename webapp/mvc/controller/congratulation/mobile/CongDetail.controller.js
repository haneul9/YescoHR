sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/DateUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    Appno,
    AppUtils,
    ComboEntry,
    DateUtils,
    Client,
    ServiceNames,
    MessageBox,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.congratulation.mobile.CongDetail', {
      initializeModel() {
        return {
          busy: true,
          BirthMaxDate: DateUtils.getToday(),
          FormData: {},
          TargetListRowCount: 1,
          benefitDate: '',
          fixRelation: true,
          relationTxt: true,
          birthDatePicker: true,
          Settings: {},
          BenefitType: [],
          BenefitCause: [],
          BenefitRelation: [],
        };
      },

      // override AttachFileCode
      getApprovalType() {
        return 'HR01';
      },

      getCurrentLocationText() {
        return this.getBundleText('LABEL_00195', 'LABEL_02001'); // {경조금} 신청
      },

      async onObjectMatched({ oDataKey }) {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setData(this.initializeModel());

          const aTypeCode = await this.getBenefitType();

          oViewModel.setProperty('/BenefitType', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: aTypeCode }));
          oViewModel.setProperty('/BenefitCause', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext' }));
          oViewModel.setProperty('/BenefitRelation', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext' }));

          this.getTargetData(oDataKey);
          this.settingsAttachTable();
        } catch (oError) {
          this.debug('Controller > CongDetail > onObjectMatched Error', oError);
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // 경조유형
      getBenefitType() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const sWerks = this.getSessionProperty('Werks');

        return Client.getEntitySet(oModel, 'BenefitCodeList', {
          Cdnum: 'BE0001',
          Werks: sWerks,
          Datum: DateUtils.getToday(),
        });
      },

      // 상세조회
      async getTargetData(sDataKey) {
        const oViewModel = this.getViewModel();

        if (!sDataKey || sDataKey === 'N') {
          const mSessionData = this.getSessionData();

          oViewModel.setProperty('/FormData', {
            ...mSessionData,
            Apename: mSessionData.Ename,
            Appernr: mSessionData.Pernr,
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
          const [oRowData] = await Client.getEntitySet(oModel, 'ConExpenseAppl', {
            Prcty: 'D',
            Menid: this.getCurrentMenuId(),
            Appno: sDataKey,
          });

          oViewModel.setProperty('/FormData', oRowData);
          oViewModel.setProperty('/ApplyInfo', oRowData);
          oViewModel.setProperty('/ApprovalDetails', oRowData);

          this.getBenefitData();
        }
      },

      // 전체list에 맞는코드 조회
      async getBenefitData() {
        const oViewModel = this.getViewModel();

        const oModel = this.getModel(ServiceNames.BENEFIT);
        const { Concode, Conresn, ZappStatAl } = oViewModel.getProperty('/FormData');
        const sWerks = this.getSessionProperty('Werks');
        const aList = Client.getEntitySet(oModel, 'BenefitCodeList', {
          Cdnum: 'BE0002',
          Werks: sWerks,
          Datum: DateUtils.getToday(),
          Upcod: Concode,
          Upcod2: 'E',
        });
        const oResult = Client.getEntitySet(oModel, 'BenefitCodeList', {
          Cdnum: 'BE0003',
          Werks: sWerks,
          Datum: DateUtils.getToday(),
          Upcod: Concode,
          Upcod2: Conresn,
        });

        oViewModel.setProperty('/BenefitCause', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: await aList }));
        oViewModel.setProperty('/BenefitRelation', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: await oResult }));
        oViewModel.setProperty('/TargetList', []);

        if (!ZappStatAl || ZappStatAl === '10') {
          let bRelTxt = true;
          let bBirthPick = true;

          if (!!oResult[0] && oResult[0].Zcode === 'ME') {
            this.onTargetDialog();
            bRelTxt = false;
            bBirthPick = false;
          }

          oViewModel.setProperty('/relationTxt', bRelTxt);
          oViewModel.setProperty('/birthDatePicker', bBirthPick);
        }
      },

      // 경조유형 선택시
      async onTypeChange(oEvent) {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          const oModel = this.getModel(ServiceNames.BENEFIT);
          const sWerks = this.getSessionProperty('Werks');
          const oSelectItems = oEvent.getParameter('changedItem');
          const sSelectKey = oSelectItems.getKey();
          const sSelectText = oSelectItems.getText();

          oViewModel.setProperty('/FormData/Context', sSelectText);

          const aList = await Client.getEntitySet(oModel, 'BenefitCodeList', {
            Cdnum: 'BE0002',
            Werks: sWerks,
            Datum: DateUtils.getToday(),
            Upcod: sSelectKey,
            Upcod2: 'E',
          });

          oViewModel.setProperty('/relationTxt', true);
          oViewModel.setProperty('/birthDatePicker', true);
          oViewModel.setProperty('/TargetList', []);
          oViewModel.setProperty('/BenefitCause', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: aList }));
          oViewModel.setProperty('/BenefitRelation', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext' }));
          oViewModel.setProperty('/FormData/Conresn', 'ALL');
          oViewModel.setProperty('/FormData/Kdsvh', 'ALL');
          oViewModel.setProperty('/FormData/Zname', '');
          oViewModel.setProperty('/FormData/Zbirthday', null);
          oViewModel.setProperty('/FormData/Conddate', null);
          oViewModel.setProperty('/FormData/Zeloc', '');
          this.getNomalPay();
        } catch (oError) {
          this.debug('Controller > CongDetail > onTypeChange Error', oError);
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // 경조사유 선택시
      async onCauseChange(oEvent) {
        const oViewModel = this.getViewModel();
        const oEventSource = oEvent.getSource();

        try {
          const oSelectItems = oEvent.getParameter('changedItem');
          const sSelectKey = oSelectItems.getKey();
          const sSelectText = oSelectItems.getText();

          oViewModel.setProperty('/busy', true);
          oViewModel.setProperty('/FormData/Conretx', sSelectText);
          oViewModel.setProperty(
            '/benefitDate',
            _.find(oViewModel.getProperty('/BenefitCause'), (e) => {
              return sSelectKey === e.Zcode;
            }).Zchar1
          );

          this.getNomalPay();

          const oModel = this.getModel(ServiceNames.BENEFIT);
          const sWerks = this.getSessionProperty('Werks');
          const mFormData = oViewModel.getProperty('/FormData');
          const oResult = await Client.getEntitySet(oModel, 'BenefitCodeList', {
            Cdnum: 'BE0003',
            Werks: sWerks,
            Datum: new Date(),
            Upcod: mFormData.Concode,
            Upcod2: sSelectKey,
          });

          oViewModel.setProperty('/TargetList', []);
          oViewModel.setProperty('/FormData/Zname', '');
          oViewModel.setProperty('/FormData/Zbirthday', null);
          oViewModel.setProperty('/FormData/Kdsvh', 'ALL');

          let bRelTxt = true;
          let bBirthPick = true;
          let aRelation = new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: oResult });

          if (!oViewModel.getProperty('/FormData/ZappStatAl') || oViewModel.getProperty('/FormData/ZappStatAl') === '10') {
            if (!!oResult[0] && oResult[0].Zcode === 'ME') {
              aRelation = oResult;
              this.onTargetDialog();
              bRelTxt = false;
              bBirthPick = false;
            } else {
              oViewModel.setProperty('/fixRelation', true);
            }

            oViewModel.setProperty('/relationTxt', bRelTxt);
            oViewModel.setProperty('/birthDatePicker', bBirthPick);
            oViewModel.setProperty('/BenefitRelation', aRelation);
          }
        } catch (oError) {
          this.debug('Controller > CongDetail > onCauseChange Error', oError);
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
          oEventSource.close();
        }
      },

      // 대상자 생년월일
      onBirthDate(oEvent) {
        const oViewModel = this.getViewModel();
        const sAddDate = oViewModel.getProperty('/benefitDate');

        if (!!sAddDate) {
          oViewModel.setProperty('/FormData/Conddate', moment(oEvent.getSource().getDateValue()).add('year', sAddDate).toDate());
        }
      },

      // 대상자 관계선택시
      onRelationChange(oEvent) {
        const oViewModel = this.getViewModel();
        const oEventSource = oEvent.getSource();
        const sSelectKey = oEventSource.getSelectedKey();

        oViewModel.setProperty('/FormData/Kdsvh', sSelectKey);

        let bRelTxt = true;
        let bBirthPick = true;

        if (!!sSelectKey && sSelectKey === 'ME') {
          this.onTargetDialog();
          bRelTxt = false;
          bBirthPick = false;
        } else {
          oViewModel.setProperty('/FormData/Zbirthday', null);
          oViewModel.setProperty('/FormData/Conddate', null);
          oViewModel.setProperty('/FormData/Zname', '');
        }

        oViewModel.setProperty('/relationTxt', bRelTxt);
        oViewModel.setProperty('/birthDatePicker', bBirthPick);
        oEventSource.close();
      },

      // 증빙상 경조일 선택시
      onBenefitChangeDate(oEvent) {
        const oConddate = oEvent.getSource().getDateValue();
        this.getViewModel().setProperty('/FormData/Conrdate', DateUtils.trimTime(oConddate));
        this.getNomalPay();
      },

      // 기본급, 지급율 등 받아옴
      async getNomalPay() {
        const oViewModel = this.getViewModel();
        const mFormData = oViewModel.getProperty('/FormData');
        const vConcode = mFormData.Concode;
        const vConresn = mFormData.Conresn;
        const vConddate = mFormData.Conddate;

        if (!vConcode || !vConresn || !vConddate) {
          oViewModel.setData(
            {
              FormData: {
                ZbacBet: 0,
                ZbacBetT: 0,
                Payrt: 0,
                PayrtT: 0,
                ZpayBet: 0,
                ZpayBetT: 0,
                Zflower: '',
                Zemp: '',
              },
            },
            true
          );
          return;
        }

        try {
          oViewModel.setProperty('/busy', true);

          const sWerks = this.getSessionProperty('Werks');
          const oModel = this.getModel(ServiceNames.BENEFIT);
          const [{ ZbacBet, ZbacBetT, Payrt, PayrtT, ZpayBet, ZpayBetT, Zflower, Zemp }] = await Client.getEntitySet(oModel, 'ConExpenseCheckList', {
            Werks: sWerks,
            Concode: vConcode,
            Conresn: vConresn,
            Conddate: vConddate,
          });

          oViewModel.setData(
            {
              FormData: {
                ZbacBet,
                ZbacBetT,
                Payrt,
                PayrtT,
                ZpayBet,
                ZpayBetT,
                Zflower,
                Zemp,
              },
            },
            true
          );
        } catch (oError) {
          this.debug('Controller > CongDetail > getNomalPay Error', oError);
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // 대상자 성명 선택시
      async onTargetDialog() {
        if (!this.oDialog) {
          this.oDialog = await Fragment.load({
            // id: this.getView().getId(),
            name: 'sap.ui.yesco.mvc.view.congratulation.mobile.fragment.TargetDialog',
            controller: this,
          });

          this.getView().addDependent(this.oDialog);
        }

        this.getTargetList();
      },

      // 대상자 리스트 조회
      async getTargetList() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          const oModel = this.getModel(ServiceNames.BENEFIT);
          const mFormData = oViewModel.getProperty('/FormData');
          const sWerks = this.getSessionProperty('Werks');
          const oTargetList = await Client.getEntitySet(oModel, 'ConExpenseSupportList', {
            Werks: sWerks,
            Concode: mFormData.Concode,
            Conresn: mFormData.Conresn,
            Datum: DateUtils.getToday(),
          });

          if (oTargetList.length === 1) {
            oViewModel.setData(
              {
                FormData: {
                  Zbirthday: oTargetList[0].Zbirthday,
                  Kdsvh: oTargetList[0].Kdsvh,
                  Famtx: oTargetList[0].Atext,
                  Zname: oTargetList[0].Zname,
                },
              },
              true
            );

            const sAddDate = oViewModel.getProperty('/benefitDate');
            if (!!sAddDate) {
              oViewModel.setProperty('/FormData/Conddate', moment(oTargetList[0].Zbirthday).add('year', sAddDate).toDate());
            }
          }

          if (_.size(oTargetList) === 1 || oViewModel.getProperty('/FormData/Kdsvh') === 'ME') {
            oViewModel.setProperty('/fixRelation', false);
            return;
          }

          const aChildList = oTargetList.filter((e) => !_.isEmpty(oTargetList) && e.Kdsvh === mFormData.Kdsvh);

          if (_.isEmpty(aChildList)) {
            return MessageBox.alert(this.getBundleText('MSG_03006')); // 해당하는 대상자 정보가 없습니다. \n 가족정보를 추가하시거나, 성명을 직접 입력하시기 바랍니다.
          }

          oViewModel.setProperty('/TargetList', aChildList);
          oViewModel.setProperty('/TargetListRowCount', _.size(aChildList));
          oViewModel.setProperty('/fixRelation', true);

          this.oDialog.open();
        } catch (oError) {
          this.debug('Controller > CongDetail > getTargetList Error', oError);
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // Dialog 대상자 클릭
      TargetClick(oEvent) {
        const vPath = oEvent.getParameters().rowBindingContext.getPath();
        const oViewModel = this.getViewModel();
        const oRowData = oViewModel.getProperty(vPath);

        oViewModel.setProperty('/FormData/Zbirthday', oRowData.Zbirthday);
        oViewModel.setProperty('/FormData/Kdsvh', oRowData.Kdsvh);
        oViewModel.setProperty('/FormData/Zname', oRowData.Zname);

        const sAddDate = oViewModel.getProperty('/benefitDate');

        if (!!sAddDate) {
          oViewModel.setProperty('/FormData/Conddate', moment(oRowData.Zbirthday).add('year', sAddDate).toDate());
        }
        this.oDialog.close();
      },

      //  대상자 성명 Dialog 닫기클릭
      onClick() {
        this.oDialog.close();
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
        if (this.checkError(this)) return;

        // {저장}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00103'), {
          actions: [
            this.getBundleText('LABEL_00118'), // 취소
            this.getBundleText('LABEL_00103'), // 저장
          ],
          onClose: async (vPress) => {
            // 저장
            if (!vPress || vPress !== this.getBundleText('LABEL_00103')) {
              return;
            }

            try {
              AppUtils.setAppBusy(true);

              const oViewModel = this.getViewModel();
              const mFormData = oViewModel.getProperty('/FormData');

              if (!mFormData.Appno) {
                const sAppno = await Appno.get.call(this);

                _.chain(mFormData).set('Appno', sAppno).set('ZappStatAl', '10').set('Appdt', new Date()).value();
              }

              // FileUpload
              await this.AttachFileAction.uploadFile.call(this, mFormData.Appno, this.getApprovalType());

              const oModel = this.getModel(ServiceNames.BENEFIT);
              const mSendObject = {
                ...mFormData,
                Prcty: 'T',
                Menid: this.getCurrentMenuId(),
                Waers: 'KRW',
              };

              await Client.create(oModel, 'ConExpenseAppl', mSendObject);

              // {저장}되었습니다.
              MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00103'));
            } catch (oError) {
              this.debug('Controller > CongDetail > onSaveBtn Error', oError);
              AppUtils.handleError(oError);
            } finally {
              AppUtils.setAppBusy(false);
            }
          },
        });
      },

      // 신청
      onApplyBtn() {
        if (this.checkError(this)) return;

        // {신청}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00121'), {
          actions: [
            this.getBundleText('LABEL_00118'), // 취소
            this.getBundleText('LABEL_00121'), // 신청
          ],
          onClose: async (vPress) => {
            // 신청
            if (!vPress || vPress !== this.getBundleText('LABEL_00121')) {
              return;
            }

            try {
              AppUtils.setAppBusy(true);

              const oViewModel = this.getViewModel();
              const mFormData = oViewModel.getProperty('/FormData');

              if (!mFormData.Appno) {
                const sAppno = await Appno.get.call(this);

                _.chain(mFormData).set('Appno', sAppno).set('Appdt', new Date()).value();
              }

              // FileUpload
              await this.AttachFileAction.uploadFile.call(this, mFormData.Appno, this.getApprovalType());

              const oModel = this.getModel(ServiceNames.BENEFIT);
              const mSendObject = {
                ...mFormData,
                Prcty: 'C',
                Menid: this.getCurrentMenuId(),
                Waers: 'KRW',
              };

              await Client.create(oModel, 'ConExpenseAppl', mSendObject);

              // {신청}되었습니다.
              MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00121'), {
                onClose: () => {
                  this.onNavBack();
                },
              });
            } catch (oError) {
              this.debug('Controller > CongDetail > onApplyBtn Error', oError);
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
          actions: [
            this.getBundleText('LABEL_00118'), // 취소
            this.getBundleText('LABEL_00114'), // 확인
          ],
          onClose: async (vPress) => {
            // 취소
            if (!vPress || vPress !== this.getBundleText('LABEL_00114')) {
              return;
            }

            AppUtils.setAppBusy(true);

            try {
              const oModel = this.getModel(ServiceNames.BENEFIT);
              const oViewModel = this.getViewModel();
              const mSendObject = {
                ...oViewModel.getProperty('/FormData'),
                Prcty: 'W',
                Menid: this.getCurrentMenuId(),
              };

              await Client.create(oModel, 'ConExpenseAppl', mSendObject);

              // {취소}되었습니다.
              MessageBox.alert(this.getBundleText('MSG_00039', 'LABEL_00121'), {
                onClose: () => {
                  this.onNavBack();
                },
              });
            } catch (oError) {
              this.debug('Controller > CongDetail > onCancelBtn Error', oError);
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
          actions: [
            this.getBundleText('LABEL_00118'), // 취소
            this.getBundleText('LABEL_00110'), // 삭제
          ],
          onClose: async (vPress) => {
            // 삭제
            if (!vPress || vPress !== this.getBundleText('LABEL_00110')) {
              return;
            }

            AppUtils.setAppBusy(true);

            try {
              const oViewModel = this.getViewModel();
              const oModel = this.getModel(ServiceNames.BENEFIT);

              await Client.remove(oModel, 'ConExpenseAppl', {
                Appno: oViewModel.getProperty('/FormData/Appno'),
              });

              // {삭제}되었습니다.
              MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00110'), {
                onClose: () => {
                  this.onNavBack();
                },
              });
            } catch (oError) {
              this.debug('Controller > CongDetail > onDeleteBtn Error', oError);
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

        this.AttachFileAction.setAttachFile(this, {
          Editable: !sStatus || sStatus === '10',
          Type: this.getApprovalType(),
          Appno: sAppno,
          Max: 10,
        });
      },

      formatFlowerTxt(vFlower) {
        return typeof vFlower === 'undefined' ? '' : vFlower === 'X' ? 'Y' : 'N';
      },
    });
  }
);
