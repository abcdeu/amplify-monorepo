import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';

import {
  BackupPlan,
  BackupPlanRule,
  BackupResource,
  BackupVault,
} from "aws-cdk-lib/aws-backup";
import { Schedule } from "aws-cdk-lib/aws-events";
import { Duration } from "aws-cdk-lib/core";
/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
});

const { amplifyDynamoDbTables } = backend.data.resources.cfnResources;
for (const table of Object.values(amplifyDynamoDbTables)) {
  table.pointInTimeRecoveryEnabled = true;
}

const backupStack = backend.createStack("backup-stack");
const myTables = Object.values(backend.data.resources.tables);


const vault = new BackupVault(backupStack, "BackupVault", {
  backupVaultName: "backup-vault",
});


const plan = new BackupPlan(backupStack, "BackupPlan", {
  backupPlanName: "backup-plan",
  backupVault: vault,
});


plan.addRule(
  new BackupPlanRule({
    deleteAfter: Duration.days(60),
    ruleName: "backup-plan-rule",
    scheduleExpression: Schedule.cron({
      minute: "0",
      hour: "0",
      day: "*",
      month: "*",
      year: "*",
    }),
  })
);


plan.addSelection("BackupPlanSelection", {
  resources: myTables.map((table) => BackupResource.fromDynamoDbTable(table)),
  allowRestores: true,
});