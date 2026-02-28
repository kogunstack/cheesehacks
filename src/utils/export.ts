import html2canvas from 'html2canvas';

export async function exportCanvasAsPng(canvasElement: HTMLElement, projectName: string) {
    const canvas = await html2canvas(canvasElement, {
        backgroundColor: '#fafbfe',
        scale: 2,
        useCORS: true,
    });
    const link = document.createElement('a');
    link.download = `${projectName.replace(/\s+/g, '-').toLowerCase()}-workflow.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}
