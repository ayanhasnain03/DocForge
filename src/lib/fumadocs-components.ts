import { Accordion, Accordions } from 'fumadocs-ui/components/accordion';
import { Banner } from 'fumadocs-ui/components/banner';
import { Callout } from 'fumadocs-ui/components/callout';
import { Card, Cards } from 'fumadocs-ui/components/card';
import { File, Files, Folder } from 'fumadocs-ui/components/files';
import { InlineTOC } from 'fumadocs-ui/components/inline-toc';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import { SafeGithubInfo } from '@/components/safe-github-info';

export const fumadocsComponents = {
  Callout,
  Card,
  Cards,
  Tab,
  Tabs,
  Step,
  Steps,
  Accordion,
  Accordions,
  File,
  Folder,
  Files,
  GithubInfo: SafeGithubInfo,
  Banner,
  InlineTOC,
};
