<?php

use Symfony\Component\HttpKernel\Kernel;
use Symfony\Component\Config\Loader\LoaderInterface;

class AppKernel extends Kernel {

    public function registerBundles() {
        $bundles = array(
            new Symfony\Bundle\FrameworkBundle\FrameworkBundle(),
            new Symfony\Bundle\SecurityBundle\SecurityBundle(),
            new Symfony\Bundle\TwigBundle\TwigBundle(),
            new Symfony\Bundle\MonologBundle\MonologBundle(),
            new Symfony\Bundle\SwiftmailerBundle\SwiftmailerBundle(),
            new Symfony\Bundle\AsseticBundle\AsseticBundle(),
            new Doctrine\Bundle\DoctrineBundle\DoctrineBundle(),
            new Doctrine\Bundle\MigrationsBundle\DoctrineMigrationsBundle(),
            new Doctrine\Bundle\FixturesBundle\DoctrineFixturesBundle(),
            new Sensio\Bundle\FrameworkExtraBundle\SensioFrameworkExtraBundle(),
            new Mesd\Jasper\ReportBundle\MesdJasperReportBundle(),
            new Ahms\PacienteBundle\AhmsPacienteBundle(),
            new Ahms\UrgenciaBundle\AhmsUrgenciaBundle(),
            new Ahms\SecurityBundle\AhmsSecurityBundle(),
            new Ahms\WidgetsBundle\AhmsWidgetsBundle(),
            new Ahms\ComumBundle\AhmsComumBundle(),
            new Ahms\BlocoBundle\AhmsBlocoBundle(),
            new Ahms\HospitalBundle\AhmsHospitalBundle(),
            new Ahms\ConsultasExternasBundle\AhmsConsultasExternasBundle(),
            new Ahms\KioskBundle\KioskBundle(),
            new Ahms\SenhasBundle\SenhasBundle(),
            new Ahms\PrescricaoBundle\AhmsPrescricaoBundle(),
            new Ahms\Cim10Bundle\AhmsCim10Bundle(),
            new Ahms\RecursosHumanosBundle\AhmsRecursosHumanosBundle(),
            new Ahms\ConfiguracaoBundle\AhmsConfiguracaoBundle(),
            new Ahms\DocumentosBundle\AhmsDocumentosBundle(),
            new Ahms\PrintBundle\AhmsPrintBundle(),
            new Ahms\FacturacaoBundle\AhmsFacturacaoBundle(),
            new Ahms\InternamentoBundle\AhmsInternamentoBundle(),
            new Ahms\MFRBundle\AhmsMFRBundle(),
            new Ahms\StockBundle\AhmsStockBundle(),
            new Ahms\MCDTBundle\AhmsMCDTBundle(),
            new Ahms\AgendaBundle\AhmsAgendaBundle(),
            new Ahms\UtilizadoresBundle\AhmsUtilizadoresBundle(),
            new Ahms\ImpressorasBundle\AhmsImpressorasBundle(),
            new Ahms\AconselhamentoBundle\AhmsAconselhamentoBundle(),
        );

        if (in_array($this->getEnvironment(), array('dev', 'test'))) {
            $bundles[] = new Symfony\Bundle\WebProfilerBundle\WebProfilerBundle();
            $bundles[] = new Sensio\Bundle\DistributionBundle\SensioDistributionBundle();
            $bundles[] = new Sensio\Bundle\GeneratorBundle\SensioGeneratorBundle();
        }

        return $bundles;
    }

    public function registerContainerConfiguration(LoaderInterface $loader) {
        $loader->load(__DIR__ . '/config/config_' . $this->getEnvironment() . '.yml');
    }

}
