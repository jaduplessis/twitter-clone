#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { TwitterCloneStack } from '../lib/twitter-clone-stack';

const app = new cdk.App();
new TwitterCloneStack(app, 'TwitterCloneStack');